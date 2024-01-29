<?php

namespace App\Lib\Handlers;

use App\Lib\OrderProcessor;
use App\Models\Order;
use Exception;
use Shopify\Webhooks\Handler;
use Illuminate\Support\Facades\Log;

class OrdersCreate implements Handler
{
    public function handle(string $topic, string $shop, array $body): void
    {
        $order = $body;

        try {
            OrderProcessor::process($shop, $order);
        } catch(Exception $e) {
            Log::error($e->getMessage());
            Log::channel('slack')->error("OrdersCreate Webhook Faile for {$order['name']}", ['exception' => $e]);
        }

    }
}
