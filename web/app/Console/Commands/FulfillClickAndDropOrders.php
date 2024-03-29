<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use App\Models\Order;
use App\Models\Session;
use Shopify\Clients\Rest;
use Illuminate\Support\Facades\Log;

class FulfillClickAndDropOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clickanddrop:fulfill-orders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fulfill orders in Shopify using tracking numbers from db table';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {

        $sessions = Session::all();

        foreach ($sessions as $session) {

            $client = new Rest($session->shop, $session->access_token);

            Order::whereNotNull('shipped_on')
            ->where('shop', $session->shop)
            ->where('fulfilled', 0)
            ->with('items')
            ->chunk(250, function($orders) use($client) {

                foreach($orders as $order) {

                    $line_item_ids = $order->items->map(fn ($item) => $item->shopify_line_id)->all();

                    $response = $client->get(path: "/orders/{$order->shopify_id}/fulfillment_orders.json");
                    $response_data = $response->getDecodedBody();

                    if ($response->getStatusCode() !== 200) {
                        $this->error("Error fetching fulfillment orders for order {$order->shopify_id}");
                        Log::stack(['slack', 'single'])->error( "Error fetching fulfillment orders for order {$order->shopify_id}", [
                            "StatusCode" => $response->getStatusCode(),
                            "Response" => json_encode($response_data, JSON_PRETTY_PRINT)
                        ]);
                        continue;
                    }

                    $actionable_fulfillment_order = null;

                    if (is_array($response_data) && isset($response_data['fulfillment_orders'])) {
                        foreach($response_data['fulfillment_orders'] as $fulfillment_order) {
                            if (!in_array('create_fulfillment', $fulfillment_order['supported_actions'])) continue;
                            $actionable_fulfillment_order =  $fulfillment_order;
                            break;
                        }
                    }

                    if (!$actionable_fulfillment_order) continue;

                    $line_items_by_fulfillment_order = [
                        [
                            'fulfillment_order_id' => $actionable_fulfillment_order['id'],
                            'fulfillment_order_line_items' => []
                        ]
                    ];

                    $tracking_info = [
                        'number' => $order->tracking_number,
                    ];

                    foreach($actionable_fulfillment_order['line_items'] as $line_item) {
                        if (in_array($line_item['line_item_id'], $line_item_ids) && $line_item['fulfillable_quantity'] > 0) {
                            $line_items_by_fulfillment_order[0]['fulfillment_order_line_items'][] = [
                                'id' => $line_item['id'],
                                'quantity' => $line_item['fulfillable_quantity']
                            ];
                        }
                    }

                    $fulfillment = [
                        'notify_customer' => true,
                        'line_items_by_fulfillment_order' => $line_items_by_fulfillment_order,
                        'tracking_info' => $tracking_info
                    ];

                    $response = $client->post(path: "/fulfillments.json", body: [
                        'fulfillment' => $fulfillment
                    ]);

                    $response_data = $response->getDecodedBody();

                    if (!is_array($response_data) || !isset($response_data['fulfillment'])) {
                        $this->error("Error creating fulfillment for order #{$order->shopify_id}");
                        Log::stack(['slack', 'single'])->error( "Error creating fulfillment for order #{$order->shopify_id}", [
                            "StatusCode" => $response->getStatusCode(),
                            "Response" => json_encode($response_data, JSON_PRETTY_PRINT)
                        ]);
                        continue;
                    }

                    $this->info("Created fulfillment for order #{$order->shopify_id}");

                    $order->fulfilled = 1;
                    $order->save();
                }

            });

        }

        return 0;
    }
}
