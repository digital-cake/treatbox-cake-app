<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\ShippingRate;


class ShippingController extends Controller
{

    public function list(Request $request)
    {
        $shop = $request->query('shop');
        $country_code = $request->query('country');

        $country_codes = collect(explode(',',$country_code))->map(fn($c) => trim($c))->values()->toArray();

        $shipping_rates_query = ShippingRate::where('shop', $shop)
                    ->where(function ($query) use($country_codes) {
                        foreach($country_codes as $c) {
                            $query->orWhere('countries', 'LIKE', "%{$c}%");
                        }
                    });

        $shipping_rates = $shipping_rates_query->get();

        return response([
            'rates' => $shipping_rates
        ], 200);
    }

    public function listAvailableCountryCodes(Request $request)
    {
        $shop = $request->query('shop');

        $rates = ShippingRate::where('shop', $shop)->get();

        $country_codes = $rates->map(fn ($rate) => $rate->countries)
                                ->flatten()
                                ->unique()
                                ->values();

        return [
            'country_codes' => $country_codes
        ];
    }
}
