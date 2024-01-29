<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('shopify.auth');
    }

    public function list(Request $request)
    {
        $session = $request->get('shopifySession');

        $page = (int)$request->query('page', 1);

        if ($page < 1) $page = 1;

        $limit = 2;
        $offset = ($page - 1) * 2;

        $order_total_count = Order::where('shop', $session->getShop())->count();

        $orders = Order::where('shop', $session->getShop())
                        ->limit($limit)
                        ->offset($offset)
                        ->orderBy('order_date', 'desc')
                        ->get();

        return [
            'has_previous_page' => $page > 1,
            'has_next_page' => ($limit * $page) < $order_total_count,
            'order_total_count' => $order_total_count,
            'orders' => $orders
        ];
    }

}
