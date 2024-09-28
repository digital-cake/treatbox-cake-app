<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Shipment;
use Illuminate\Support\Facades\Validator;

class ShipmentController extends Controller
{

    public function lookup(Request $request)
    {
        $shop = $request->query('shop', null);

        if (!$shop) {
            return response([
                'errors' => ['shop parameter is required']
            ], 422);
        }

        $shipment_ids = $request->query('shipment_ids', null);

        if (!$shipment_ids) {
            return response([
                'errors' => ['shipment_ids parameter is required']
            ], 422);
        }

        $shipment_ids = collect(explode(',', $shipment_ids))->map(fn ($id) => trim($id))->values()->toArray();

        $shipments = Shipment::where('shop', $shop)
                            ->whereIn('shipment_id', $shipment_ids)
                            ->get();

        return [
            'shipments' => $shipments
        ];
    }

    public function save(Request $request)
    {
        $shop = $request->query('shop', null);

        if (!$shop) {
            return response([
                'errors' => ['shop parameter is required']
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'shipments' => ['required', 'array'],
            'shipments.*.address_id' => ['required', 'uuid'],
            'shipments.*.rate_id' => ['required', 'exists:shipping_rates,id'],
            'shipments.*.delay' => ['date', 'nullable']
        ]);

        if ($validator->fails()) {
            return response([
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();
        $saved_shipments = [];

        foreach($validated['shipments'] as $shipment_data) {
            $shipment_id = $shipment_data['address_id'];

            if (!empty($shipment_data['delay'])) {
                $shipment_id .= "_" . $shipment_data['delay'];
            }

            $shipment = Shipment::firstOrNew([
                'shop' => $shop,
                'shipment_id' => $shipment_id
            ]);

            $shipment->shipping_rate_id = $shipment_data['rate_id'];

            $shipment->save();

            $saved_shipments[] = $shipment;
        }

        return [
            'shipments' => $saved_shipments
        ];
    }
}
