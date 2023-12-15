<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Shopify\Clients\Rest;
use Illuminate\Support\Str;

use App\Models\ActiveCarrierService;

class ActiveCarrierServiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('shopify.auth');
    }

    public function get(Request $request)
    {
        $session = $request->get('shopifySession');

        $active_carrier_service = ActiveCarrierService::where('shop', $session->getShop())->first();

        return ['active_carrier_service' => $active_carrier_service];
    }

    public function toggle(Request $request)
    {
        $session = $request->get('shopifySession');

        $active_carrier_service = ActiveCarrierService::where('shop', $session->getShop())->first();

        $client = new Rest($session->getShop(), $session->getAccessToken());

        if ($active_carrier_service) {
            $api_response = $client->delete("carrier_services/{$active_carrier_service->carrier_service_id}");

            if ($api_response->getStatusCode() != 200) {
                return response([
                    'server_error' => "Failed to deactivate carrier service. Please try again later",
                    'shopify_response' => $api_response->getDecodedBody()
                ], $api_response->getStatusCode());
            }

            $active_carrier_service->delete();
            $active_carrier_service = null;

        } else {

            $application_url = config('app.url');
            $callback_url = Str::finish($application_url, '/') . 'api/carrier-service/callback';

            $api_response = $client->post('carrier_services', [
                'carrier_service' => [
                    "active" => true,
                    "callback_url" => $callback_url,
                    "name" => "cake_shipping_app",
                    "service_discovery" => true
                ]
            ]);

            $api_response_status_code = $api_response->getStatusCode();

            if ($api_response_status_code < 200 || $api_response_status_code > 299) {
                return response([
                    'server_error' => "Failed to activate carrier service. Please try again later",
                    'shopify_response' => $api_response->getDecodedBody()
                ], $api_response->getStatusCode());
            }

            $response_data = $api_response->getDecodedBody();

            $active_carrier_service = new ActiveCarrierService([
                'shop' => $session->getShop(),
                'carrier_service_id' => $response_data['carrier_service']['id'],
                'name' => $response_data['carrier_service']['name'],
                'callback_url' => $response_data['carrier_service']['callback_url']
            ]);

            $active_carrier_service->save();

        }

        return ['active_carrier_service' => $active_carrier_service];

    }

}
