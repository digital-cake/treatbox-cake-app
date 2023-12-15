<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SettingOption;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{

    public function __construct()
    {
        $this->middleware('shopify.auth');
    }

    public function all(Request $request)
    {
        $session = $request->get('shopifySession');

        $options = SettingOption::where('shop', $session->getShop())
                            ->get();

        $options_nvp = [];

        foreach($options as $option) {
            $options_nvp[$option->name] = $option->value;
        }

        return response([
            'options' => (object)$options_nvp
        ], 200);
    }

    public function save(Request $request)
    {

        $session = $request->get('shopifySession');

        $validator = Validator::make($request->all(), [
            'options' => ['array', 'nullable']
        ]);

        if ($validator->fails()) {
            return response([
                'field_errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        $existing_options = SettingOption::where('shop', $session->getShop())->get();

        if (isset($validated['options'])) {
            foreach($validated['options'] as $name => $value) {
                $option = $existing_options->firstWhere('name', $name);

                if (!$option) {
                    $option = new SettingOption([
                        'shop' => $session->getShop(),
                        'name' => $name
                    ]);

                    $existing_options->push($option);
                }

                $option->value = $value;
                $option->save();
            }
        }

        $options_nvp = [];

        foreach($existing_options as $option) {
            $options_nvp[$option->name] = $option->value;
        }

        return response([
            'options' => (object)$options_nvp
        ]);

    }

}
