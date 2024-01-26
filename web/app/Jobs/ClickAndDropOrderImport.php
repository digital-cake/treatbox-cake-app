<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Models\SettingOption;
use App\Services\ClickAndDropService;

class ClickAndDropOrderImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $order;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {

        if ($this->order->click_and_drop_id) return;

        $click_and_drop_api_key = SettingOption::where('shop', $this->order->shop)
                                                    ->where('name', 'click_and_drop_api_key')
                                                    ->value('value');

        $click_and_drop = new ClickAndDropService($click_and_drop_api_key);

        $item = [
            'orderReference' => $this->order->channel_reference,
            'recipient' => [
                'address' => [
                    'fullName' => $this->order->recipient_name,
                    'companyName' => $this->order->recipient_company ? $this->order->recipient_company : "",
                    'addressLine1' => Str::limit($this->order->recipient_address1, 97),
                    'addressLine2' => $this->order->recipient_address2 ? Str::limit($this->order->recipient_address2, 97) : "",
                    'city' => $this->order->recipient_city,
                    'county' => $this->order->recipient_county,
                    'postcode' => !empty($this->order->recipient_postcode) ? $this->order->recipient_postcode : 'N/a',
                    'countryCode' => $this->order->recipient_country_code
                ]
            ],
            'billing' => [
                'address' => [
                    'fullName' => $this->order->billing_name,
                    'addressLine1' =>  Str::limit($this->order->billing_address1, 97),
                    'addressLine2' => $this->order->billing_address2 ? Str::limit($this->order->billing_address2, 97) : "",
                    'city' => $this->order->billing_city,
                    'postcode' => !empty($this->order->billing_postcode) ? $this->order->billing_postcode : 'N/a',
                    'countryCode' => $this->order->billing_country_code
                ]
            ],
            'packages' => [
                [
                    'weightInGrams' => 1,
                    'packageFormatIdentifier' => 'undefined',
                    'contents' => []
                ]
            ],
            'orderDate' => Carbon::createFromFormat('Y-m-d H:i:s', $this->order->order_date)->toIso8601String(),
            'subtotal' => $this->order->subtotal,
            'shippingCostCharged' => $this->order->shipping_cost_charged,
            'total' => $this->order->total,
            'currencyCode' => $this->order->currency_code,
            'specialInstructions' => $this->order->special_instructions ? Str::limit($this->order->special_instructions, 500, "") : "",
            'tags' => [
                [
                    "key" => "Store postage method",
                    "value" => $this->order->selected_shipping_method
                ]
            ]
        ];

        $order_items = $this->order->items()->get();

        foreach($order_items as $index => $order_item) {

            $item['packages'][0]['weightInGrams'] += ($order_item->weight * $order_item->quantity);

            $sku = Str::random(3) . $index;

            $item['packages'][0]['contents'][] = [
                'name' => Str::limit($order_item->item_name, 800, ""),
                'SKU' => $sku,
                'quantity' => $order_item->quantity,
                'unitValue' => $order_item->price,
                'unitWeightInGrams' => $order_item->weight
            ];
        }

        $response = null;

        try {
            $response = $click_and_drop->createOrders([$item]);
            $response->throw();
            $response = $response->json();
        } catch(\Exception $ex) {
            Log::stack(['single', 'slack'])->error("Error creating order {$this->order->channel_reference} in Click & Drop: " . $ex->getMessage());
            return;
        }

        if (isset($response['createdOrders']) && count($response['createdOrders']) > 0) {
            foreach($response['createdOrders'] as $created_order) {
                $this->order->click_and_drop_id = $created_order['orderIdentifier'];
                $this->order->save();
            }
        }

    }

    public function failed(\Throwable $exception = null)
    {
        Log::channel('slack')->error('ClickAndDropOrderImport Job Failed', ['exception' => $exception]);
    }
}
