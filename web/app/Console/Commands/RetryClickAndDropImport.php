<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use App\Models\Order;
use App\Models\Session;
use Illuminate\Support\Carbon;
use App\Jobs\ClickAndDropOrderImport;

class RetryClickAndDropImport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clickanddrop:retry-import';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Query orders without click_and_drop_id and retry import';

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

        $twenty_minutes_ago = Carbon::now()->subMinutes(20)->format('Y-m-d H:i:s');

        foreach ($sessions as $session) {

            Order::whereNull('click_and_drop_id')
            ->where('created_at', '<', $twenty_minutes_ago)
            ->where('shop', $session->shop)
            ->with('items')
            ->chunk(250, function($orders) {

                foreach($orders as $order) {
                    ClickAndDropOrderImport::dispatch($order);
                }

            });

        }

        return 0;
    }
}
