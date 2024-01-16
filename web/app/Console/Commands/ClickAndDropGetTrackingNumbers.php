<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\SettingOption;
use App\Models\Session;
use App\Services\ClickAndDropService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class ClickAndDropGetTrackingNumbers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clickanddrop:gettrackingnumbers';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetches tracking numbers from the Click & Drop API';

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

            $click_and_drop_api_key = SettingOption::where('shop', $session->shop)
                                                    ->where('name', 'click_and_drop_api_key')
                                                    ->value('value');

            if (!$click_and_drop_api_key) continue;

            $click_and_drop = new ClickAndDropService($click_and_drop_api_key);

            Order::whereNotNull('click_and_drop_id')
            ->where('shop', $session->shop)
            ->whereNull('shipped_on')
            ->chunk(250, function($orders) use($click_and_drop) {

                if ($orders->isEmpty()) {
                    $this->info("No tracking numbers to fetch");
                    return;
                }

                $order_identifiers = $orders->map(function($item, $key) {
                    return $item->click_and_drop_id;
                });

                $response = $click_and_drop->getOrders($order_identifiers->join(";"));

                if ($response->getReasonPhrase() != "OK") {

                    Log::stack(['slack', 'single'])->error( "Failed to fetch tracking numbers for orders: {$order_identifiers->join(', ')}", [
                        "StatusCode" => $response->status(),
                        "Response" => (string)$response->getBody()
                    ]);

                    return;
                }

                $response = $response->json();

                $updated_orders = collect([]);

                foreach($response as $cad_order) {

                    if (!empty($cad_order['code']) && $cad_order['code'] == '2') {
                        $this->info("Order #{$cad_order['accountOrderNumber']} removed from Channel Shipper");
                        $order = $orders->firstWhere('order_id', $cad_order['accountOrderNumber']);
                        if ($order) {
                            $order->delete();
                            $this->info("Order #{$cad_order['accountOrderNumber']} removed from DB");
                        }
                        continue;
                    }

                    if (empty($cad_order['orderIdentifier'])) continue;

                    if (empty($cad_order['shippedOn'])) continue;

                    $order = $orders->firstWhere('click_and_drop_id', $cad_order['orderIdentifier']);
                    $order->tracking_number = !empty($cad_order['trackingNumber']) ? $cad_order['trackingNumber'] : null;
                    $order->shipped_on = Carbon::parse($cad_order['shippedOn'])->format('Y-m-d H:i:s');

                    $order->save();

                    $updated_orders->push([
                        "order_id" => $order->order_id,
                        "tracking_number" => $order->tracking_number
                    ]);
                }

                $this->info($updated_orders);

            });

        }


        return 0;
    }
}
