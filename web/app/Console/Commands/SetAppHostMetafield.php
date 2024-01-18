<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Session;
use Shopify\Clients\Graphql;
use Shopify\Context;

class SetAppHostMetafield extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:setapphostmetafield {shop}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Updates app installation metafield';

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

        $shop = $this->argument('shop');

        $session = Session::where('shop', $shop)->first();

        if (!$session) return 0;

        Context::$HOST_NAME;

        $client = new Graphql($session->shop, $session->access_token);

        $app_installation_query = <<<'QUERY'
        {
            currentAppInstallation {
                id
            }
        }
        QUERY;

        $response = $client->query([
            'query' => $app_installation_query
        ]);

        $response = $response->getDecodedBody();

        $app_installation_id = $response['data']['currentAppInstallation']['id'];

        $metafield_set_mutation =  <<<'QUERY'
        mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafieldsSetInput) {
                metafields {
                    id
                    namespace
                    key
                    value
                }
                userErrors {
                    field
                    message
                }
            }
        }
        QUERY;

        $response = $client->query([
            'query' => $metafield_set_mutation,
            'variables' => [
                'metafieldsSetInput' => [
                    "namespace" => "cake",
                    "key" => "host",
                    "type" => "single_line_text_field",
                    "value" => Context::$HOST_NAME,
                    "ownerId" => $app_installation_id
                ]
            ]
        ]);

        $response = $response->getDecodedBody();

        $this->info(json_encode($response, JSON_PRETTY_PRINT));

        return 0;
    }
}
