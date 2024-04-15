<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProductLeadTimeOverride;
use App\Models\ProductLeadTimeOverrideWeekday;
use Illuminate\Support\Facades\Validator;

class ProductLeadTimeOverrideController extends Controller
{

    public function __construct()
    {
        $this->middleware('shopify.auth');
    }

    public function list(Request $request)
    {
        $session = $request->get('shopifySession');

        $product_lead_time_overrides = ProductLeadTimeOverride::where('shop', $session->getShop())->get();

        return [
            'product_lead_time_overrides' => $product_lead_time_overrides,
        ];
    }

    public function store($id, Request $request)
    {
        $session = $request->get('shopifySession');

        $validator = Validator::make($request->all(), [
            'overrides' => ['required', 'array'],
            'overrides.tag' => ['required', 'string', 'max:255'],
            'overrides.title' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response([
                'field_errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        $overrides = null;

        if ($id == 'new') {
            $overrides = new ProductLeadTimeOverride(['shop' => $session->getShop()]);
            $overrides->tag = $validated['overrides']['tag'];
            $overrides->title = $validated['overrides']['title'];
            $overrides->save();

            if ($overrides) {
                foreach ($validated['overrides']['lead_times'] as $lead_time) {
                    $overrides_weekdays = new ProductLeadTimeOverrideWeekday;

                    $overrides_weekdays->override_id = $overrides->id;
                    $overrides_weekdays->fill($lead_time);
                    $overrides_weekdays->save();
                }
            }
        } else {
            $overrides = ProductLeadTimeOverride::where('id', $id)
                            ->where('shop', $session->getShop())
                            ->first();             

            $overrides->tag = $validated['overrides']['tag'];
            $overrides->title = $validated['overrides']['title'];
            $overrides->save();  

            $existing_overrides = ProductLeadTimeOverrideWeekday::where('override_id', $id)->get();
            
            if ($overrides) {
                foreach ($validated['overrides']['lead_times'] as $lead_time) {
                    $incoming_lead_time = $existing_overrides->first(fn ($db_lead_time) => 
                        $db_lead_time->day_index == $lead_time['day_index']
                    );

                    $incoming_lead_time->fill($lead_time);
                    $incoming_lead_time->save();
                }
            }
        }

        if (!$overrides) {
            return response([
                'server_error' => "Product lead time override #{$id} not found"
            ], 404);
        }

        $response = $overrides->with('leadTimes')->get();

        return response([
            'product_lead_times_overrides' => $response[0]
        ], 200);
    }

    public function get(int $id, Request $request)
    {
        $session = $request->get('shopifySession');

        $override = ProductLeadTimeOverride::where('id', $id)
                        ->where('shop', $session->getShop())
                        ->with('leadTimes')
                        ->get();

        if (!$override) {
            return response([
                'server_error' => "Product lead time override #{$id} not found"
            ], 404);
        }

        //this needs to return as same structure, title, tag, array
        return response([
            'override' => $override
        ], 200);
    }

    public function delete(int $id, Request $request)
    {
        $session = $request->get('shopifySession');

        $override = ProductLeadTimeOverride::where('id', $id)
            ->where('shop', $session->getShop())
            ->first();

        $weekdays = ProductLeadTimeOverrideWeekday::where('override_id', $id)
            ->get(); 

        if (!$override) {
            return response([
                'server_error' => "ProductLeadTimeOverride #{$id} not found"
            ], 404);
        }

        $delete_id = $override->id;

        foreach ($weekdays as $weekday) {
            $weekday->delete();
        }

        $override->delete();

        return ['deleted' => $delete_id];
    }
}
