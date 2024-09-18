<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ShippingRate;

class ShippingController extends Controller
{

    public function list(Request $request)
    {
        $shop = $request->query('shop');
        $country_code = $request->query('country');

        $shipping_rates = ShippingRate::where('shop', $shop)
                    ->where('countries', 'LIKE', "%{$country_code}%")
                    ->get();

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
