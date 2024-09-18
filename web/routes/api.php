<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\ShippingRate;
use App\Models\ProductLeadTimeOverride;
use App\Models\DefaultProductLeadTime;
use App\Http\Controllers\Public\ByobController;
use App\Http\Controllers\Public\ShippingController;
use Illuminate\Support\Carbon;

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

Route::controller(ShippingController::class)->group(function() {
    Route::get('/shipping-rates', 'list');
    Route::get('/shipping/country-codes', 'listAvailableCountryCodes');
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

    //to map day index against php date index
    $GB_WEEK_INDEX_MAP = [6,0,1,2,3,4,5];

    $shop = $request->query('shop');

    $product_tags = $request->product_tags;

    $override_lead_times_tags = ProductLeadTimeOverride::where('shop', $shop)
                            ->pluck('tag')->toArray();

    if (!$product_tags) {
        $product_tags = [];
    }

    //check if product tag matches override tag
    $matching_tag = array_intersect($product_tags, $override_lead_times_tags);

    //get current day data
    $day_start_carbon = Carbon::now('Europe/London');
    $day_of_week_index = $GB_WEEK_INDEX_MAP[(int)$day_start_carbon->format('w')];

    if (count($matching_tag) > 0) {
        //get first element of array if multiple, can only use 1 tag to get overide lead times
        //return current days lead times
        $tag = reset($matching_tag);
        $tag_lead_time_weekdays = ProductLeadTimeOverride::where('tag', $tag)
            ->where('shop', $shop)
            ->with('leadTimes')
            ->first();

        return response([
            'current_day_lead_time' => $tag_lead_time_weekdays->leadTimes[$day_of_week_index]
        ], 200);

    } else {
        //return current days lead times
        $default_lead_time_weekdays = DefaultProductLeadTime::where('day_index', $day_of_week_index)->first();

        return response([
            'current_day_lead_time' => $default_lead_time_weekdays
        ], 200);
    };
});
