<?php

declare(strict_types=1);

namespace App\Lib;

use Exception;
use Shopify\Auth\Session;
use Shopify\Clients\Graphql;

class ShopifyCartTransforms
{

    private const GET_CART_TRANSFORMS_QUERY = <<<'QUERY'
    {
        cartTransforms(first: 50) {
            nodes {
                id
                functionId
            }
        }
    }
    QUERY;

    private const CREATE_CART_TRANSFORM_MUTATION = <<<'QUERY'
    mutation cartTransformCreate($functionId: String!) {
        cartTransformCreate(functionId: $functionId) {
            cartTransform {
                functionId
                id
            }
            userErrors {
                field
                message
            }
        }
    }
    QUERY;

    private const DELETE_CART_TRANSFORM_MUTATION = <<<'QUERY'
    mutation cartTransformDelete($id: ID!) {
        cartTransformDelete(id: $id) {
            deletedId
            userErrors {
                field
                message
            }
        }
    }
    QUERY;

    public static function get(Session $session)
    {
        $client = new Graphql($session->getShop(), $session->getAccessToken());

        $response = $client->query(
            [
                "query" => self::GET_CART_TRANSFORMS_QUERY
            ]
        );

        if ($response->getStatusCode() !== 200) {
            throw new Exception($response->getBody()->__toString());
        }

        return $response->getDecodedBody();
    }

    public static function create(Session $session, string $function_id)
    {
        $client = new Graphql($session->getShop(), $session->getAccessToken());

        $response = $client->query(
            [
                "query" => self::CREATE_CART_TRANSFORM_MUTATION,
                "variables" => [
                    'functionId' => $function_id
                ]
            ]
        );

        if ($response->getStatusCode() !== 200) {
            throw new Exception($response->getBody()->__toString());
        }

        return $response->getDecodedBody();
    }

    public static function delete(Session $session, string $id)
    {
        $client = new Graphql($session->getShop(), $session->getAccessToken());

        $response = $client->query(
            [
                "query" => self::DELETE_CART_TRANSFORM_MUTATION,
                "variables" => [
                    'id' => $id
                ]
            ]
        );

        if ($response->getStatusCode() !== 200) {
            throw new Exception($response->getBody()->__toString());
        }

        return $response->getDecodedBody();
    }

}
