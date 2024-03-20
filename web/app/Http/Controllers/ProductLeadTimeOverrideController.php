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
            
            //create associated entity
            $overrides_weekdays = new ProductLeadTimeOverrideWeekday;
            //assign values here
            //$overrides_weekdays
        } else {
            //get associated table rows here
            $overrides = ProductLeadTimeOverride::where('id', $id)
                            ->where('shop', $session->getShop())
                            ->whereHas('product_lead_time_override_weekdays', function($query) use($overrides){
                                $query->where('override_id', '==', $overrides->id);
                            })->get();
        }

        if (!$overrides) {
            return response([
                'server_error' => "Product lead time override #{$id} not found"
            ], 404);
        }

        return response([
            'product_lead_times_overrides' => $overrides
        ], 200);
    }

    public function get(int $id, Request $request)
    {
        $session = $request->get('shopifySession');

        $override = ProductLeadTimeOverride::where('shop', $session->getShop())
                                                    ->where('id', $id)
                                                    ->first();

        //query other table to get associated lead time weekdays, where id == override_id
        //need to setup one to many relationship
        //query builder



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

}
