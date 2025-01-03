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

class OrderProcessor
{

    public static function process(string $shop, array $order) : void
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

        $line_items = self::extractLineItems($order);
        $shipping_addresses = self::extractShippingAddresses($order, $line_items->where('shipping_item', false));

        $shipping_rates = ShippingRate::all();

        $billing_address = [
            'billing_name' => trim($order['billing_address']['first_name'] . " " . $order['billing_address']['last_name']),
            'billing_address1' =>  $order['billing_address']['address1'] ? $order['billing_address']['address1'] : $order['shipping_address']['address1'],
            'billing_address2' => $order['billing_address']['address2'] ? $order['billing_address']['address2'] : $order['shipping_address']['address2'],
            'billing_city' => $order['billing_address']['city'] ?  $order['billing_address']['city'] : $order['shipping_address']['city'],
            'billing_postcode' => $order['billing_address']['zip'] ? $order['billing_address']['zip'] : $order['shipping_address']['zip'],
            'billing_country_code' => $order['billing_address']['country_code'] ? $order['billing_address']['country_code'] : $order['shipping_address']['country_code'],
        ];

        $data_item_added = false;
        $shipping_data_item = $line_items->firstWhere('shipping_item', true);

        foreach($shipping_addresses as $index => $shipping_address) {

            $channel_ref = "{$prefix}{$order['name']}_{$index}";

            $count = Order::where('channel_reference', $channel_ref)->count();

            if ($count > 0) continue;

            $incoming_order = new Order;

            $shipping_rate = $shipping_rates->firstWhere('id', $shipping_address['shipping_rate_id']);
            $rate_name = $shipping_rate ? $shipping_rate->name : $order['shipping_lines'][0]['title'];
            $shipping_cost = $shipping_rate ? $shipping_rate->base_rate : floatval($order['total_shipping_price_set']['presentment_money']['amount']);

            $subtotal = 0;

            $incoming_order->fill([
                'shop' => $shop,
                'shopify_id' => $order['id'],
                'name' => $order['name'],
                'channel_reference' => $channel_ref,
                'shipping_cost_charged' => $shipping_cost,
                'currency_code' => $order['total_price_set']['presentment_money']['currency_code'],
                'order_date' => Carbon::parse($order['processed_at'])->format('Y-m-d H:i:s'),
                'selected_shipping_method' => $rate_name,
                'recipient_name' => $shipping_address['name'],
                'recipient_address1' => $shipping_address['address1'],
                'recipient_address2' => $shipping_address['address2'],
                'recipient_company' => !empty($shipping_address['company']) ? $shipping_address['company'] : null,
                'recipient_city' => $shipping_address['city'],
                'recipient_county' => $shipping_address['county'],
                'recipient_postcode' => $shipping_address['postcode'],
                'recipient_country_code' => $shipping_address['country_code']
            ]);

            $incoming_order->fill($billing_address);

            $order_items = $line_items->whereIn('custom_identifier', $shipping_address['item_custom_ids']);

            if ($order_items->count() < 1) continue;

            $incoming_items = collect([]);

            if ($shipping_data_item && !$data_item_added) {
                $incoming_items->push(new OrderItem([
                    'shopify_line_id' => $shipping_data_item['id'],
                    'item_name' => $shipping_data_item['name'],
                    'sku' => 'SHIPPING_DATA',
                    'quantity' => $shipping_data_item['quantity'],
                    'price' => 0,
                    'weight' => 0
                ]));
                $data_item_added = true;
            }

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
            }

            $incoming_order->fill([
                'subtotal' => $subtotal,
                'total' => $subtotal + $shipping_cost,
                'special_instructions' => self::extractSpecialInstructions($order_items)
            ]);

            $incoming_order->save();
            $incoming_order->items()->saveMany($incoming_items);

            ClickAndDropOrderImport::dispatch($incoming_order);
        }

    }

    private static function extractLineItems(array $order) : Collection
    {
        $line_items = collect([]);

        foreach($order['line_items'] as $line_item) {

            /* Items with the "_shipping_methods" property shouldn't be processed as a shippable line_item as this item
            * is only present because it contains information about the shipping method applied to an address */
            $shipping_methods_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_shipping_methods');

            if ($shipping_methods_prop) {
                $line_items->push([
                    'shipping_item' => true,
                    'custom_identifier' => null,
                    'box' => false,
                    ...$line_item
                ]);

                continue;
            }

            $custom_identifier = null;

            //Standard items have a "_ts" (timestamp) property which is unique enough to be an identifier
            $timestamp_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_ts');
            //Only BYOB boxes will have the "_id" property
            //BYOB box items have the "_box_id" property which should match the "_id" property of the box product
            $id_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_id');

            if ($timestamp_prop) {
                $custom_identifier = $timestamp_prop['value'];
            } else if ($id_prop) {
                $custom_identifier = $id_prop['value'];
            }

            if (!$custom_identifier) {
                $box_id_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_box_id');

                if ($box_id_prop) continue;

                $custom_identifier = (string)Str::uuid();
            }

            $line_item = [
                'shipping_item' => false,
                'custom_identifier' => $custom_identifier,
                'box' => false,
                ...$line_item
            ];

            if ($id_prop) {

                $line_item['box'] = true;

                $line_item['children'] = Arr::where($order['line_items'], function ($item) use($id_prop) {
                    $box_id_prop = Arr::first($item['properties'], fn ($prop) => $prop['name'] == '_box_id');

                    if (!$box_id_prop) return false;

                    if ($box_id_prop['value'] != $id_prop['value']) return false;

                    $box_bool_prop = Arr::first($item['properties'], fn ($prop) => $prop['name'] == '_box' && $prop['value'] == 'true');

                    if ($box_bool_prop) return false;

                    return true;
                });

            }

            $line_items->push($line_item);
        }

        return $line_items;
    }

    private static function extractShippingAddresses(array $order, Collection $line_items) : Collection
    {
        $shipping_addresses = collect([]);

        $shipping_method_allocation = [];

        $custom_line_item_ids = $line_items->map(fn ($item) => $item['custom_identifier']);

        foreach($order['line_items'] as $line_item) {
            $shipping_methods_prop = Arr::first($line_item['properties'], fn ($prop) => $prop['name'] == '_shipping_methods');

            if (!$shipping_methods_prop) continue;

            $shipping_method_allocation = json_decode($shipping_methods_prop['value'], true);

            break;
        }

        $additional_addresses_attr = Arr::first($order['note_attributes'], fn ($attr) => $attr['name'] == '__additional_addresses');
        $additional_addresses = !empty($additional_addresses_attr) ? json_decode($additional_addresses_attr['value'], true) : [];

        $additional_address_item_custom_ids = collect([]);

        foreach($additional_addresses as $address) {
            $additional_address = [
                'id' => $address['id'],
                'name' => trim($address['firstName'] . " " . $address['lastName']),
                'address1' => $address['address1'],
                'address2' => !empty($address['address2']) ? $address['address2'] : null,
                'city' => $address['city'],
                'county' => $address['province'],
                'postcode' => $address['zip'],
                'country_code' => $address['countryCode'],
                'company' => !empty($address['company']) ? $address['company'] : null,
                'item_custom_ids' => [],
                'shipping_rate_id' => isset($shipping_method_allocation[$address['id']]) ? $shipping_method_allocation[$address['id']] : null
            ];

            if (is_array($address['items'])) {
                foreach($address['items'] as $item) {
                    $custom_identifier = null;

                    if ($item['boxId']) {
                        $custom_identifier = $item['boxId'];
                    } else {
                        $custom_identifier = $item['ts'];
                    }

                    if (!$custom_identifier) continue;

                    $additional_address['item_custom_ids'][] = $custom_identifier;
                    $additional_address_item_custom_ids->push($custom_identifier);
                }
            }

            $shipping_addresses->push($additional_address);
        }

        $primary_address = [
            'id' => 'primary',
            'name' => trim($order['shipping_address']['first_name'] . " " . $order['shipping_address']['last_name']),
            'address1' => $order['shipping_address']['address1'],
            'address2' => $order['shipping_address']['address2'],
            'city' => $order['shipping_address']['city'],
            'county' => $order['shipping_address']['province'],
            'postcode' => $order['shipping_address']['zip'],
            'country_code' => $order['shipping_address']['country_code'],
            'company' =>  $order['shipping_address']['company'],
            'shipping_rate_id' => isset($shipping_method_allocation['primary']) ? $shipping_method_allocation['primary'] : null,
            'item_custom_ids' => $custom_line_item_ids->diff($additional_address_item_custom_ids)
        ];

        $shipping_addresses->push($primary_address);

        return $shipping_addresses;
    }

    private static function extractSpecialInstructions(Collection $line_items)
    {
        $special_instruction_lines = [];

        foreach($line_items as $line_item) {
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

        $do_not_open_until_field_prop = Arr::first($line_item['properties'], function($prop) {
            return strtolower($prop['name']) == 'do not open until sticker';
        });

        if ($do_not_open_until_field_prop) {
            $special_instruction_lines["{$line_item['id']}_do_not_open"] = "Do not open until sticker: {$do_not_open_until_field_prop['value']}";
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
