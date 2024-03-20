<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        'api/graphql',
        'api/webhooks',
        'api/settings',
        'api/active-carrier-service',
        'api/shipping-rates/*',
        'api/carrier-service/callback',
        'api/cart-transform/*',
        'api/product-lead-times/*',
        'api/product-lead-times-overrides/*'
    ];
}