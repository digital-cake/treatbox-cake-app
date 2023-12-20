<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\ShippingRate;

class ShippingRateController extends Controller
{
    public function __construct()
    {
        $this->middleware('shopify.auth');
    }

    public function get(int $id, Request $request)
    {
        $session = $request->get('shopifySession');

        $rate = ShippingRate::where('shop', $session->getShop())
                                                    ->where('id', $id)
                                                    ->first();

        if (!$rate) {
            return response([
                'server_error' => "ShippingRate #{$id} not found"
            ], 404);
        }

        return response([
            'shipping_rate' => $rate
        ], 200);
    }

    public function list(Request $request)
    {
        $session =  $request->get('shopifySession');

        $rates = ShippingRate::where('shop', $session->getShop())
                                ->get();

        return response([
            'shipping_rates' => $rates
        ], 200);

    }

    public function save($id, Request $request)
    {

        $session = $request->get('shopifySession');

        $validator = Validator::make($request->all(), [
            'shipping_rate' => ['required', 'array'],
            'shipping_rate.name' => ['required', 'string', 'max:255'],
            'shipping_rate.description' => ['string', 'nullable', ''],
            'shipping_rate.countries' => ['array', 'nullable'],
            'shipping_rate.base_rate' => ['required', 'numeric'],
            'shipping_rate.free_delivery_threshold_enabled' => ['boolean', 'required'],
            'shipping_rate.free_delivery_threshold' => ['required_if:rate.free_delivery_threshold_enabled,true', 'numeric', 'nullable']
        ], [], [
            'shipping_rate.name' => 'name',
            'shipping_rate.countries' => 'countries',
            'shipping_rate.base_rate' => 'base rate',
            'shipping_rate.free_delivery_threshold_enabled' => 'free delivery enabled',
            'shipping_rate.free_delivery_threshold' => 'free delivery threshold'
        ]);

        if ($validator->fails()) {
            return response([
                'field_errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        $rate = null;

        if ($id == 'new') {
            $rate = new ShippingRate(['shop' => $session->getShop()]);
        } else {
            $rate = ShippingRate::where('id', $id)
                                ->where('shop', $session->getShop())
                                ->first();
        }

        if (!$rate) {
            return response([
                'server_error' => "ShippingRate #{$id} not found"
            ], 404);
        }

        foreach($validated['shipping_rate'] as $prop => $value) {
            if ($prop == 'free_delivery_threshold_enabled') continue;

            if ($prop == 'countries') {
                $rate->$prop = implode(',', $value);
                continue;
            }

            $rate->$prop = $value;
        }

        if (empty($validated['shipping_rate']['description'])) {
            $rate->description = null;
        }

        if (empty($validated['shipping_rate']['free_delivery_threshold_enabled'])) {
            $rate->free_delivery_threshold = null;
        }

        $rate->save();

        return response([
            'shipping_rate' => $rate
        ], 200);
    }

    public function delete(int $id, Request $request)
    {
        $session = $request->get('shopifySession');

        $rate = ShippingRate::where('id', $id)
            ->where('shop', $session->getShop())
            ->first();

        if (!$rate) {
            return response([
                'server_error' => "ShippingRate #{$id} not found"
            ], 404);
        }

        $delete_id = $rate->id;

        $rate->delete();

        return ['deleted' => $delete_id];
    }

}
