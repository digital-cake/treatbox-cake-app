<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\ShippingRate;
use App\Models\ProductLeadTimeOverride;
use App\Http\Controllers\Public\ByobController;

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

Route::controller(ByobController::class)->group(function() {
    Route::post('/byob/session-id', 'generateSessionId');
    Route::post('/byob/save', 'saveBoxData');
    Route::post('/byob/delete', 'deleteBoxData');

    Route::options('/byob/session-id', 'preflight');
    Route::options('/byob/save', 'preflight');
    Route::options('/byob/delete', 'preflight');
});

Route::post('/product-lead-times-from-tag', function (Request $request) {
    //check if product has override tag, if has return override lead times
    //if not return default lead times

    $shop = $request->query('shop');

    $override_lead_times = ProductLeadTimeOverride::where('shop', $shop)
                         ->get();

    return response([
        'lead_times' => $override_lead_times
    ], 200);                     
});