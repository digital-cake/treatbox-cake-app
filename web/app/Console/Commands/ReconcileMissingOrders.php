<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Session;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Shopify\Clients\Rest;
use App\Lib\OrderProcessor;

class ReconcileMissingOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reconcile-missing-orders {--days=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find past orders in Shopify and if they havent been stored already, restore them';

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
        $days = $this->option('days');

        $created_at_min = Carbon::today('Europe/London')->subDays($days)->toISOString();
        $created_at_max = Carbon::now('Europe/London')->subHours(1)->toISOString();

        $sessions = Session::all();

        foreach ($sessions as $session) {
            $client = new Rest($session->shop, $session->access_token);

            $this->info("Fetching orders from the last {$days} days for {$session->shop}...");

            $response = $client->get(path: "/orders.json", query: [
                'created_at_min' => $created_at_min,
                'created_at_max' => $created_at_max,
                'status' => 'any',
                'limit' => 250
            ]);

            $response_data = $response->getDecodedBody();

            foreach($response_data['orders'] as $order) {
                $count = Order::where('shopify_id', $order['id'])->count();

                if (!is_array($order['shipping_lines']) && count($order['shipping_lines']) < 1) {
                    continue;
                }

                if ($order['source_name'] == 'subscription_contract') {
                    continue;
                }

                if ($count > 0) {
                    $this->info("Order {$order['id']} exists. Skipping...");
                    continue;
                }

                $this->info("Order {$order['id']} doesn't exist. Processing...");

                OrderProcessor::process($session->shop, $order);
            }

        }

    }
}
