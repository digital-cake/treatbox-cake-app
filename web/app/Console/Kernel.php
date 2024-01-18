<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Console\Commands\ClickAndDropGetTrackingNumbers;
use App\Console\Commands\FulfillClickAndDropOrders;
use App\Console\Commands\SetAppHostMetafield;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        ClickAndDropGetTrackingNumbers::class,
        FulfillClickAndDropOrders::class,
        SetAppHostMetafield::class
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command(ClickAndDropGetTrackingNumbers::class)->everyFiveMinutes();
        $schedule->command(FulfillClickAndDropOrders::class)->everyFiveMinutes();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
