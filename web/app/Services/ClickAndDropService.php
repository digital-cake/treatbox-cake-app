<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ClickAndDropService
{

    private $auth_token;

    public function __construct($auth_token)
    {
        $this->auth_token = $auth_token;
    }

    private function makeRequest(string $endpoint, string $method = 'GET', $data = null)
    {

        $endpoint = Str::start($endpoint, '/');
        $url = "https://api.parcel.royalmail.com{$endpoint}";

        $client = Http::withHeaders([
            'Authorization' => "Bearer {$this->auth_token}"
        ]);

        $response = null;

        switch(Str::upper($method)) {
            case 'GET':
                $response = $client->get($url, $data);
            break;
            case 'POST':
                $response = $client->post($url, $data);
            break;
            case 'PUT':
                $response = $client->put($url, $data);
            break;
            case 'DELETE':
                $response = $client->delete($url);
            break;
        }

        return $response;
    }

    public function deleteOrders(string $identifiers)
    {
        $endpoint = "/api/v1/orders/$identifiers";
        return $this->makeRequest($endpoint, "DELETE");
    }

    public function getOrders(string $identifiers)
    {
        $endpoint = "/api/v1/orders/$identifiers";
        return $this->makeRequest($endpoint, "GET");
    }

    public function getOrdersPaged(array $query_parameters, \Closure $callback)
    {

        while (true) {

            $response = $this->makeRequest('/api/v1/orders', 'GET', $query_parameters);
            $response_data = $response->json();

            $callback($response_data);

            if (!isset($response['continuationToken'])) break;

            $query_parameters['continuationToken'] = $response['continuationToken'];

        }

    }

    public function createOrders(array $items)
    {
        $endpoint = "/api/v1/orders";
        return $this->makeRequest($endpoint, "POST", [ "items" => $items ]);
    }

}
