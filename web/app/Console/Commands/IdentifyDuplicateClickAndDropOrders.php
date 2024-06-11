<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Session;
use App\Models\SettingOption;
use App\Models\Order;
use App\Services\ClickAndDropService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class IdentifyDuplicateClickAndDropOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clickanddrop:identify-duplicate-orders {--days=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find duplicate Click & Drop orders with the same channel reference';

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

        $sessions = Session::all();

        foreach ($sessions as $session) {

            $click_and_drop_api_key = SettingOption::where('shop', $session->shop)
                                                    ->where('name', 'click_and_drop_api_key')
                                                    ->value('value');

            if (!$click_and_drop_api_key) continue;

            $click_and_drop = new ClickAndDropService($click_and_drop_api_key);

            $click_and_drop_channel_ref_prefix = SettingOption::where('shop', $session->shop)
                                                        ->where('name', 'click_and_drop_channel_ref_prefix')
                                                        ->value('value');

            $this->info("Fetching orders from the last {$days} days...");

            $days_ago = Carbon::today('Europe/London')->subDays($days)->toISOString();

            $channel_ref_orders = [];

            $page = 0;

            $click_and_drop->getOrdersPaged([
                'pageSize' => 100,
                'startDateTime' => $days_ago
            ], function($response_data) use (&$channel_ref_orders, &$page, $click_and_drop_channel_ref_prefix) {

                $page++;

                $this->info("PAGE {$page}");

                //dd($response_data['orders'][0]);

                foreach($response_data['orders'] as $order) {

                    if (!isset($order['orderReference'])) {
                        continue;
                    };

                    $channel_ref = $order['orderReference'];

                    if ($click_and_drop_channel_ref_prefix && strpos($channel_ref, $click_and_drop_channel_ref_prefix) === FALSE) {
                        continue;
                    }

                    if (!isset($channel_ref_orders[$channel_ref])) {
                        $channel_ref_orders[$channel_ref] = [];
                    }
                    $channel_ref_orders[$channel_ref][] = $order['orderIdentifier'];
                }

            });

            $count = 0;

            $db_orders = Order::where('shop', $session->shop)
                        ->where('created_at', '>', $days_ago)
                        ->get();

            foreach($channel_ref_orders as $channel_ref => $orders) {
                $order_count = count($orders);

                if ($order_count < 2) continue;

                $count++;

                $found_db_order = null;

                foreach($orders as $order_click_and_drop_id) {
                    $found_db_order = $db_orders->firstWhere('click_and_drop_id', $order_click_and_drop_id);

                    if ($found_db_order) break;
                }

                $cs_order_ids = implode(", ", $orders);

                $this->info("{$count}: Order {$channel_ref} has {$order_count} channel shipper orders: {$cs_order_ids}");

                Log::channel('slack')->error("{$count}: Order {$channel_ref} has {$order_count} channel shipper orders: {$cs_order_ids}", [
                    'additional data' => [
                        'db_click_and_drop_id' => $found_db_order ? $found_db_order->click_and_drop_id : null
                    ]
                ]);


            }

        }

        return 0;
    }
}
