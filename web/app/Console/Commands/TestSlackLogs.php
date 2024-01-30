<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TestSlackLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-slack-logs {message}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'A command to test slack logging';

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

        $message = $this->argument('message');

        Log::channel('slack')->error("Test: $message", [
            'additional data' => [
                'code' => Str::random(4),
                'reason' => 'test',
                'time' => date('Y-m-d H:i:s')
            ]
        ]);

        return 0;
    }
}
