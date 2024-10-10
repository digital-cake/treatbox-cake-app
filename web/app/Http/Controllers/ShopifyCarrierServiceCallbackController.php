<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;
use Shopify\Clients\HttpHeaders;
use Illuminate\Support\Carbon;
use App\Models\ShippingRate;
use App\Models\Shipment;

class ShopifyCarrierServiceCallbackController extends Controller
{
    public function handle(Request $request)
    {

        $shop = $request->header(HttpHeaders::X_SHOPIFY_DOMAIN, null);

        if (!$shop) return [ 'rates' => [] ];

        $request_body = $request->all();

        $rate = isset($request_body['rate']) ? $request_body['rate'] : null;

        if (!$rate) return [ 'rates' => [] ];

        $line_items = isset($rate['items']) ? collect($rate['items']) : collect([]);

        $shipment_ids = [];

        foreach($line_items as $line_item) {
            if (empty($line_item['properties']['_address_id'])) continue;

            $shipment_id = $line_item['properties']['_address_id'];

            if (!empty($line_item['properties']['Delay'])) {
                $shipment_id .= '_' . $line_item['properties']['Delay'];
            }

            if (!in_array($shipment_id, $shipment_ids)) {
                $shipment_ids[] = $shipment_id;
            }
        }

        if (count($shipment_ids) < 1) {

            $country_code = $rate['destination']['country'];

            $shipping_rates = ShippingRate::where('countries', 'LIKE', "%{$country_code}%")
                                            ->where('shop', $shop)
                                            ->get();

            return [
                'rates' => $shipping_rates->map(function($rate) {
                    return [
                        'service_name' => $rate->name,
                        'service_code' => "cake_app_{$rate->id}",
                        'total_price' => $rate->base_rate * 100,
                        'currency' => 'GBP',
                        'description' => $rate->description
                    ];
                })
            ];

        }

        $shipments = Shipment::where('shop', $shop)
                            ->whereIn('shipment_id', $shipment_ids)
                            ->get();

        $selected_rates = collect([]);

        foreach($shipments as $shipment) {
            if (!$shipment->rate) continue;
            $selected_rates->push($shipment->rate);
        }

        if ($selected_rates->count() < count($shipment_ids)) {
            return [ 'rates' => [] ];
        }

        $service_name = "";
        $description = "";
        $total_price = 0;
        $service_code = "";

        if ($selected_rates->count() < 2) {
            $service_name = $selected_rates[0]->name;
            $description = $selected_rates[0]->description;
            $total_price += $selected_rates[0]->base_rate * 100;
            $service_code = "cake_app_{$selected_rates[0]->id}";
        } else {
            $service_code = "cake_app_multiship";
            $service_name = "Multiple shipping rates";
            foreach($selected_rates as $rate) {
                if (!empty($description)) {
                    $description .= " | ";
                }
                $rate_display_price = $rate->base_rate > 0 ? "£" . $rate->base_rate : "Free";
                $description .= $rate->name . " (" . $rate_display_price . ")";
                $total_price += $rate->base_rate * 100;
            }
        }

        return [
            'rates' => [
                [
                    'service_name' => $service_name,
                    'service_code' => $service_code,
                    'total_price' => $total_price,
                    'currency' => 'GBP',
                    'description' => $description
                ]
            ]
        ];

    }
}
