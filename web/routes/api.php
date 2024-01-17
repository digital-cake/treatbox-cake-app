<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\ShippingRate;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/', function () {
    return "Hello API";
});

Route::get('/shipping-rates', function (Request $request) {

    $shop = $request->query('shop');
    $country_code = $request->query('country');

    $shipping_rates = ShippingRate::where('shop', $shop)
                ->where('countries', 'LIKE', "%{$country_code}%")
                ->get();

    return response([
        'rates' => $shipping_rates
    ], 200);

});

