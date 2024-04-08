<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DefaultProductLeadTime;

class DefaultProductLeadTimeController extends Controller
{

    public function __construct()
    {
        $this->middleware('shopify.auth');
    }

    public function list(Request $request)
    {
        $session = $request->get('shopifySession');

        $default_product_lead_times = DefaultProductLeadTime::where('shop', $session->getShop())->get();

        $ordered_lead_times = collect([]);

        for ($i = 0; $i < 7; $i++) {
            $lead_time = $default_product_lead_times->firstWhere('day_index', $i);
            $ordered_lead_times->push($lead_time);
        } 

        return [
            'default_product_lead_times' => $ordered_lead_times,
        ];
    }

    public function store(Request $request)
    {
        $session = $request->get('shopifySession');

        $existing_lead_times = DefaultProductLeadTime::where('shop', $session->getShop())->get();
        
        foreach($request->lead_times as $lead_time) {
           $incoming_lead_time = $existing_lead_times->first(fn ($db_lead_time) => 
                $db_lead_time->day_index == $lead_time['day_index']
            );
        
            if (!$incoming_lead_time) {
                $incoming_lead_time = new DefaultProductLeadTime(['shop' => $session->getShop()]);
            }
        
            $incoming_lead_time->fill($lead_time);
        
            $incoming_lead_time->save();
        }

        return [
            'success' => 'Default lead times updated',
        ];
    }
}
