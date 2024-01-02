<?php

namespace App\Lib\Handlers;

use Shopify\Webhooks\Handler;
use Illuminate\Support\Facades\Log;

class OrdersCreate implements Handler
{
    public function handle(string $topic, string $shop, array $body): void
    {
        Log::info([ 'topic' => $topic, 'shop' => $shop, 'body' => $body ]);
    }
}
