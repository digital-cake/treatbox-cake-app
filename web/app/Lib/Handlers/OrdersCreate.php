<?php

namespace App\Lib\Handlers;

use App\Lib\OrderProcessor;
use App\Lib\NewOrderProcessor;
use App\Models\Order;
use Exception;
use Shopify\Webhooks\Handler;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class OrdersCreate implements Handler
{
    public function handle(string $topic, string $shop, array $body): void
    {
        $order = $body;

        $order_addresses_attr = Arr::first($order['note_attributes'], fn ($attr) => $attr['name'] == 'addresses', null);

        try {
            if ($order_addresses_attr) {
                $order_addresses = json_decode($order_addresses_attr['value'], true);
                NewOrderProcessor::process($shop, $order, $order_addresses);
            } else {
                OrderProcessor::process($shop, $order);
            }

        } catch(Exception $e) {
            Log::error($e->getMessage());
            Log::channel('slack')->error("OrdersCreate Webhook Faile for {$order['name']}", ['exception' => $e]);
        }

    }
}
