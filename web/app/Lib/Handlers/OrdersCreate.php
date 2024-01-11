<?php

namespace App\Lib\Handlers;

use App\Lib\OrderProcessor;
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

        if (!is_array($order['shipping_lines']) && count($order['shipping_lines']) < 1) {
            return;
        }

        try {
            OrderProcessor::process($shop, $order);
        } catch(Exception $e) {
            Log::error($e->getMessage());
        }

    }
}
