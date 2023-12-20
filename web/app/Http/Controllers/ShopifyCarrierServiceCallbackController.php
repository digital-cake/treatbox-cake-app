<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

use Illuminate\Support\Carbon;
use App\Models\ShippingRate;

class ShopifyCarrierServiceCallbackController extends Controller
{
    public function handle(Request $request)
    {
        $request_body = $request->all();

        $rate = isset($request_body['rate']) ? $request_body['rate'] : null;

        if (!$rate) return [ 'rates' => [] ];

        $cart_total = 0;

        $line_items = isset($rate['items']) ? $rate['items'] : [];

        $available = true;

        $unique_shipping_rate_prop_values = collect([]);

        foreach($line_items as $line_item) {

            $cart_total += ($line_item['price'] * $line_item['quantity']) / 100;

            if (!$line_item['requires_shipping']) continue;

            if (empty($line_item['properties']['_shipping_rate'])) {
                $available = false;
                break;
            }

            if ($unique_shipping_rate_prop_values->contains($line_item['properties']['_shipping_rate'])) continue;

            $unique_shipping_rate_prop_values->push($line_item['properties']['_shipping_rate']);
        }

        if (!$available) return [ 'rates' => [] ];

        $shipping_rate_ids = $unique_shipping_rate_prop_values->map(function($str) {
            $str_parts = explode(':', $str);
            return end($str_parts);
        });

        $selected_rates = collect([]);

        foreach($shipping_rate_ids as $rate_id) {
            $rate = ShippingRate::where('id', $rate_id)->first();
            if (!$rate) continue;
            $selected_rates->push($rate);
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
                $description .= $rate->name . " " . $rate_display_price;
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
