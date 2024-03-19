<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProductLeadTime;

class ProductLeadTimeController extends Controller
{

    public function __construct()
    {
        $this->middleware('shopify.auth');
    }


    public function list(Request $request)
    {
        $session = $request->get('shopifySession');

        $product_lead_times = ProductLeadTime::where('shop', $session->getShop())->get();

        $ordered_lead_times = collect([]);

        for ($i = 0; $i < 7; $i++) {
            $lead_time = $product_lead_times->firstWhere('day_index', $i);
            $ordered_lead_times->push($lead_time);
        } 

        return [
            'product_lead_times' => $ordered_lead_times,
        ];
    }

    public function store(Request $request)
    {
        $session = $request->get('shopifySession');

        $existing_lead_times = ProductLeadTime::where('shop', $session->getShop())->get();
        
        foreach($request->lead_times as $lead_time) {
           $incoming_lead_time = $existing_lead_times->first(fn ($db_lead_time) => 
                $db_lead_time->day_index == $lead_time['day_index'] && $db_lead_time->tag == $lead_time['tag']
            );
        
            if (!$incoming_lead_time) {
                $incoming_lead_time = new ProductLeadTime(['shop' => $session->getShop()]);
            }
        
            $incoming_lead_time->fill($lead_time);
        
            $incoming_lead_time->save();
        }

        return [
            'success' => 'Lead times updated',
        ];
    }
}
