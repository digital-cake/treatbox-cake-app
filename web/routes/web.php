<?php

use App\Exceptions\ShopifyProductCreatorException;
use App\Lib\AuthRedirection;
use App\Lib\EnsureBilling;
use App\Lib\ProductCreator;
use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Shopify\Auth\OAuth;
use Shopify\Auth\Session as AuthSession;
use Shopify\Clients\HttpHeaders;
use Shopify\Clients\Rest;
use Shopify\Context;
use Shopify\Exception\InvalidWebhookException;
use Shopify\Utils;
use Shopify\Webhooks\Registry;
use Shopify\Webhooks\Topics;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ActiveCarrierServiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ShippingRateController;
use App\Http\Controllers\ShopifyCarrierServiceCallbackController;
use App\Http\Controllers\ShopifyCartTransformController;
use App\Http\Controllers\DefaultProductLeadTimeController;
use App\Http\Controllers\ProductLeadTimeOverrideController;
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\SetAppHostMetafield;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
| If you are adding routes outside of the /api path, remember to also add a
| proxy rule for them in web/frontend/vite.config.js
|
*/

Route::fallback(function (Request $request) {
    if (Context::$IS_EMBEDDED_APP &&  $request->query("embedded", false) === "1") {
        if (env('APP_ENV') === 'production') {
            return file_get_contents(public_path('index.html'));
        } else {
            return file_get_contents(base_path('frontend/index.html'));
        }
    } else {
        return redirect(Utils::getEmbeddedAppUrl($request->query("host", null)) . "/" . $request->path());
    }
})->middleware('shopify.installed');

Route::get('/api/auth', function (Request $request) {
    $shop = Utils::sanitizeShopDomain($request->query('shop'));

    // Delete any previously created OAuth sessions that were not completed (don't have an access token)
    Session::where('shop', $shop)->where('access_token', null)->delete();

    return AuthRedirection::redirect($request);
});

Route::get('/api/auth/callback', function (Request $request) {
    $session = OAuth::callback(
        $request->cookie(),
        $request->query(),
        ['App\Lib\CookieHandler', 'saveShopifyCookie'],
    );

    $host = $request->query('host');
    $shop = Utils::sanitizeShopDomain($request->query('shop'));

    $response = Registry::register('/api/webhooks', Topics::APP_UNINSTALLED, $shop, $session->getAccessToken());

    if ($response->isSuccess()) {
        Log::debug("Registered APP_UNINSTALLED webhook for shop $shop");
    } else {
        Log::error(
            "Failed to register APP_UNINSTALLED webhook for shop $shop with response body: " .
                print_r($response->getBody(), true)
        );
    }

    $response = Registry::register('/api/webhooks', Topics::ORDERS_CREATE, $shop, $session->getAccessToken());

    if ($response->isSuccess()) {
        Log::debug("Registered ORDERS_CREATE webhook for shop $shop");
    } else {
        Log::error(
            "Failed to register ORDERS_CREATE webhook for shop $shop with response body: " .
                print_r($response->getBody(), true)
        );
    }

    Artisan::queue(SetAppHostMetafield::class, [
        'shop' => $shop
    ]);

    $redirectUrl = Utils::getEmbeddedAppUrl($host);

    if (Config::get('shopify.billing.required')) {
        list($hasPayment, $confirmationUrl) = EnsureBilling::check($session, Config::get('shopify.billing'));

        if (!$hasPayment) {
            $redirectUrl = $confirmationUrl;
        }
    }

    return redirect($redirectUrl);
});

Route::get('/api/products/count', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $client = new Rest($session->getShop(), $session->getAccessToken());
    $result = $client->get('products/count');

    return response($result->getDecodedBody());
})->middleware('shopify.auth');

Route::get('/api/products/create', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $success = $code = $error = null;
    try {
        ProductCreator::call($session, 5);
        $success = true;
        $code = 200;
        $error = null;
    } catch (\Exception $e) {
        $success = false;

        if ($e instanceof ShopifyProductCreatorException) {
            $code = $e->response->getStatusCode();
            $error = $e->response->getDecodedBody();
            if (array_key_exists("errors", $error)) {
                $error = $error["errors"];
            }
        } else {
            $code = 500;
            $error = $e->getMessage();
        }

        Log::error("Failed to create products: $error");
    } finally {
        return response()->json(["success" => $success, "error" => $error], $code);
    }
})->middleware('shopify.auth');

Route::controller(SettingsController::class)->group(function() {
    Route::get('/api/settings', 'all');
    Route::post('/api/settings', 'save');
});

Route::controller(ActiveCarrierServiceController::class)->group(function() {
    Route::get('/api/active-carrier-service', 'get');
    Route::put('/api/active-carrier-service', 'toggle');
});

Route::controller(ShippingRateController::class)->group(function() {
    Route::get('/api/shipping-rates', 'list');
    Route::get('/api/shipping-rates/{id}', 'get');
    Route::post('/api/shipping-rates/{id}', 'save');
    Route::delete('/api/shipping-rates/{id}', 'delete');
});

Route::controller(ShopifyCarrierServiceCallbackController::class)->group(function() {
    Route::post('/api/carrier-service/callback', 'handle');
});

Route::controller(ShopifyCartTransformController::class)->group(function() {
    Route::get('/api/cart-transform/{function_name}', 'get');
    Route::post('/api/cart-transform/deactivate', 'deactivate');
    Route::post('/api/cart-transform/{function_name}/activate', 'activate');
});

Route::controller(OrderController::class)->group(function() {
    Route::get('/api/orders', 'list');
});

Route::controller(DefaultProductLeadTimeController::class)->group(function() {
    Route::get('/api/product-lead-times/list', 'list');
    Route::post('/api/product-lead-times/store', 'store');
});

Route::controller(ProductLeadTimeOverrideController::class)->group(function() {
    Route::get('/api/product-lead-times-overrides/list', 'list');
    Route::get('/api/product-lead-times-overrides/{id}', 'get');
    Route::post('/api/product-lead-times-overrides/{id}', 'store');
});

Route::post('/api/webhooks', function (Request $request) {
    try {
        $topic = $request->header(HttpHeaders::X_SHOPIFY_TOPIC, '');

        //dd(base64_encode(hash_hmac('sha256', $request->getContent(), Context::$API_SECRET_KEY, true)));

        $response = Registry::process($request->header(), $request->getContent());
        if (!$response->isSuccess()) {
            Log::error("Failed to process '$topic' webhook: {$response->getErrorMessage()}");
            return response()->json(['message' => "Failed to process '$topic' webhook"], 500);
        }
    } catch (InvalidWebhookException $e) {
        Log::error("Got invalid webhook request for topic '$topic': {$e->getMessage()}");
        return response()->json(['message' => "Got invalid webhook request for topic '$topic'"], 401);
    } catch (\Exception $e) {
        Log::error("Got an exception when handling '$topic' webhook: {$e->getMessage()}");
        return response()->json(['message' => "Got an exception when handling '$topic' webhook"], 500);
    }
});
