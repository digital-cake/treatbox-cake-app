<?php

declare(strict_types=1);

namespace App\Lib;

use App\Exceptions\ShopifyFunctionGetException;
use Shopify\Auth\Session;
use Shopify\Clients\Graphql;

class ShopifyFunctions
{
    private const GET_FUNCTIONS_QUERY = <<<'QUERY'
    query {
        shopifyFunctions(first: 250) {
            nodes {
                app {
                    title
                }
                apiType
                title
                id
            }
        }
    }
    QUERY;

    public static function get(Session $session)
    {
        $client = new Graphql($session->getShop(), $session->getAccessToken());

        $response = $client->query(
            [
                "query" => self::GET_FUNCTIONS_QUERY
            ]
        );

        if ($response->getStatusCode() !== 200) {
            throw new ShopifyFunctionGetException($response->getBody()->__toString(), $response);
        }

        return $response->getDecodedBody();

    }

}
