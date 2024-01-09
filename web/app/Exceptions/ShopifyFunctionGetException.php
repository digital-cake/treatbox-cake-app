<?php

namespace App\Exceptions;

use Exception;
use Shopify\Clients\HttpResponse;

class ShopifyFunctionGetException extends Exception
{
    public HttpResponse $response;

    public function __construct(string $message, HttpResponse $response = null)
    {
        parent::__construct($message);

        $this->response = $response;
    }
}
