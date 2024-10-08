<?php

namespace App\Lib;

use App\Models\Order;
use App\Models\OrderItem;
use App\Jobs\ClickAndDropOrderImport;
use App\Models\SettingOption;
use App\Models\ShippingRate;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Illuminate\Support\Carbon;
use App\Models\Shipment;
use Exception;

class NewOrderProcessor
{

    public static function process(string $shop, array $order, array $addresses) : void
    {

        if (!is_array($order['shipping_lines']) && count($order['shipping_lines']) < 1) {
            return;
        }

        if ($order['source_name'] == 'subscription_contract') {
            return;
        }

        if (empty($order['shipping_address'])) return;

        $subscription_line_item = Arr::first($order['line_items'], function ($line_item) {
            $lc_name = strtolower($line_item['name']);
            return Str::contains($lc_name, 'subscribe') || Str::contains($lc_name, 'subscription');
        });

        if ($subscription_line_item) return;

        $prefix = SettingOption::where('shop', $shop)
                    ->where('name', 'click_and_drop_channel_ref_prefix')
                    ->value('value');

        if (!is_string($prefix)) {
            $prefix = "";
        } else {
            $prefix = trim($prefix);
        }

        $shipments = self::extractShipments($shop, $order, $addresses);

        $billing_address = [
            'billing_name' => trim($order['billing_address']['first_name'] . " " . $order['billing_address']['last_name']),
            'billing_address1' =>  $order['billing_address']['address1'] ? $order['billing_address']['address1'] : $order['shipping_address']['address1'],
            'billing_address2' => $order['billing_address']['address2'] ? $order['billing_address']['address2'] : $order['shipping_address']['address2'],
            'billing_city' => $order['billing_address']['city'] ?  $order['billing_address']['city'] : $order['shipping_address']['city'],
            'billing_postcode' => $order['billing_address']['zip'] ? $order['billing_address']['zip'] : $order['shipping_address']['zip'],
            'billing_country_code' => $order['billing_address']['country_code'] ? $order['billing_address']['country_code'] : $order['shipping_address']['country_code'],
        ];

        foreach($shipments as $index => $shipment) {
            $channel_ref = "{$prefix}{$order['name']}_{$index}";

            $incoming_order = new Order;

            $shipping_rate = $shipment['rate'];
            $rate_name = $shipping_rate ? $shipping_rate->name : "NOT FOUND";
            $shipping_cost = $shipping_rate ? $shipping_rate->base_rate : floatval($order['total_shipping_price_set']['presentment_money']['amount']);

            $shipping_address = $shipment['address'];

            $incoming_order->fill([
                'shop' => $shop,
                'shopify_id' => $order['id'],
                'name' => $order['name'],
                'channel_reference' => $channel_ref,
                'shipping_cost_charged' => $shipping_cost,
                'currency_code' => $order['total_price_set']['presentment_money']['currency_code'],
                'order_date' => Carbon::parse($order['processed_at'])->format('Y-m-d H:i:s'),
                'selected_shipping_method' => $shipment['rate_name'],
                'recipient_name' => $shipping_address['name'],
                'recipient_address1' => $shipping_address['address1'],
                'recipient_address2' => $shipping_address['address2'],
                'recipient_company' => !empty($shipping_address['company']) ? $shipping_address['company'] : null,
                'recipient_city' => $shipping_address['city'],
                'recipient_county' => $shipping_address['county'],
                'recipient_postcode' => $shipping_address['postcode'],
                'recipient_country_code' => $shipping_address['country_code']
            ]);

            $subtotal = 0;

            $order_items = collect($shipment['line_items']);

            if ($order_items->count() < 1) continue;

            $incoming_items = collect([]);

            foreach($order_items as $line_item) {

                $price = floatval($line_item['price']);

                $subtotal += $price;

                $incoming_items->push(new OrderItem([
                    'shopify_line_id' => $line_item['id'],
                    'item_name' => $line_item['name'],
                    'sku' => $line_item['sku'],
                    'quantity' => $line_item['quantity'],
                    'price' => $price,
                    'weight' => $line_item['grams']
                ]));

                if (!isset($line_item['children']) || !is_array($line_item['children'])) continue;

                foreach($line_item['children'] as $child_line_item) {
                    $price = floatval($child_line_item['price']);

                    $subtotal += $price;

                    $incoming_items->push(new OrderItem([
                        'parent' => $line_item['id'],
                        'shopify_line_id' => $child_line_item['id'],
                        'item_name' => $child_line_item['name'],
                        'sku' => $child_line_item['sku'],
                        'quantity' => $child_line_item['quantity'],
                        'price' => $price,
                        'weight' => $child_line_item['grams']
                    ]));
                }

                $incoming_order->fill([
                    'subtotal' => $subtotal,
                    'total' => $subtotal + $shipping_cost,
                    'special_instructions' => self::extractSpecialInstructions($shipment)
                ]);

                $incoming_order->save();
                $incoming_order->items()->saveMany($incoming_items);

                ClickAndDropOrderImport::dispatch($incoming_order);
            }

        }

    }

    private static function extractShipments(string $shop, array $order, array $addresses)
    {
        $shipments = [];

        foreach($order['line_items'] as $line_item) {
            $box_id_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_box_id');

            if ($box_id_prop) continue;

            $custom_line_item = [
                'box' => false,
                ...$line_item
            ];

            $id_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_id');

            if ($id_prop) {

                $custom_line_item['box'] = true;

                $custom_line_item['children'] = Arr::where($order['line_items'], function ($item) use($id_prop) {
                    $box_id_prop = Arr::first($item['properties'], fn ($prop) => $prop['name'] == '_box_id');

                    if (!$box_id_prop) return false;

                    if ($box_id_prop['value'] != $id_prop['value']) return false;

                    $box_bool_prop = Arr::first($item['properties'], fn ($prop) => $prop['name'] == '_box' && $prop['value'] == 'true');

                    if ($box_bool_prop) return false;

                    return true;
                });

            }

            $address_id_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_address_id');

            if (!$address_id_prop) continue;

            $address = Arr::first($addresses, fn ($address) => $address['id'] == $address_id_prop['value']);

            if (!$address) continue;

            $shipment_id = $address_id_prop['value'];

            $delay_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == 'Delay');
            $delay_date = null;

            //Sometimes Shopify's checkout will change a null value of a property to a string with the value of "null"
            if ($delay_prop && $delay_prop['value'] !== 'null') {
                $shipment_id .= "_" . $delay_prop['value'];
                $delay_date = $delay_prop['value'];
            }

            if (!isset($shipments[$shipment_id])) {
                $shipments[$shipment_id] = [
                    'address' => $address,
                    'line_items' => [],
                    'delay' => $delay_date
                ];
            }

            $shipments[$shipment_id]['line_items'][] = $custom_line_item;
        }

        $shipment_ids = array_keys($shipments);
        $shipment_configurations = Shipment::where('shop', $shop)->whereIn('shipment_id', $shipments)->with('rate')->get();

        $shipments_array = [];

        foreach($shipments as $id => $shipment) {
            $shipment['id'] = $id;

            $conf = $shipment_configurations->firstWhere('shipment_id', $id);
            $shipment['rate'] = null;

            if ($conf) {
                $shipment['rate'] = $conf->rate;
            }

            $shipments_array[] = $shipment;
        }

        return $shipments_array;
    }

    private static function extractSpecialInstructions(array $shipment)
    {
        $special_instruction_lines = [];

        if ($shipment['delay']) {
            try {
                $special_instruction_lines['Delay'] = Carbon::createFromFormat('Y-m-d', $shipment['delay'], 'Europe/London')->format('jS M Y');
            } catch(\Exception $e) {
                //Do nothing
            }
        }

        foreach($shipment['line_items'] as $line_item) {
            $line_special_instructions = self::extractSpecialInstructionsFromLineItem($line_item);
            $special_instruction_lines = [ ...$special_instruction_lines, ...$line_special_instructions ];

            if (isset($line_item['children']) && is_array($line_item['children'])) {
                foreach($line_item['children'] as $child_line_item) {
                    $line_special_instructions = self::extractSpecialInstructionsFromLineItem($child_line_item);
                    $special_instruction_lines = [ ...$special_instruction_lines, ...$line_special_instructions ];
                }
            }
        }

        return implode("\n\n", $special_instruction_lines);
    }

    private static function extractSpecialInstructionsFromLineItem(array $line_item)
    {

        $special_instruction_lines = [];

        $message_props = Arr::where($line_item['properties'], function ($prop) {
            return Str::contains(Str::lower($prop['name']), 'message');
        }, null);

        foreach($message_props as $index => $prop) {
            if (!empty($prop['value'])) {
                $special_instruction_lines["{$line_item['id']}_message_{$index}"] = "{$prop['name']}: {$prop['value']}";
            }
        }

        $date_prop = Arr::first($line_item['properties'], function ($prop, $key) {
            return Str::contains(Str::lower($prop['name']), 'date');
        }, null);


        if ($date_prop) {
            $special_instruction_lines["{$line_item['id']}_date"] = "{$date_prop['name']}: {$date_prop['value']}";
        }

        $delivery_preference = Arr::first($line_item['properties'], function($prop) {
            return $prop['name'] == 'Delivery Option';
        });

        if ($delivery_preference) {
            $special_instruction_lines['delivery_preference'] = "Delivery Preference: {$delivery_preference['value']}";
        }

        $date_of_birth_field_prop = Arr::first($line_item['properties'], function($prop) {
            return $prop['name'] == '_dob_field_prop';
        });

        $date_of_birth_field_prop = $date_of_birth_field_prop ? $date_of_birth_field_prop['value'] : "DOB";

        $date_of_birth = Arr::first($line_item['properties'], function($prop) use($date_of_birth_field_prop) {
            return $prop['name'] == $date_of_birth_field_prop;
        });

        if ($date_of_birth) {
            $special_instruction_lines['dob'] = "{$date_of_birth_field_prop}: {$date_of_birth['value']}";
        }

        $shipping_by_field_prop = Arr::first($line_item['properties'], function($prop) {
            return strtolower($prop['name']) == 'shipping by';
        });

        if ($shipping_by_field_prop) {
            $special_instruction_lines["{$line_item['id']}_shipping_date"] = "Shipping by: {$shipping_by_field_prop['value']}";
        }

        return $special_instruction_lines;

    }

}
