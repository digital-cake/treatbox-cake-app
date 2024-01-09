<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

use App\Lib\ShopifyFunctions;
use App\Lib\ShopifyCartTransforms;
use Illuminate\Support\Facades\Validator;
use Exception;

class ShopifyCartTransformController extends Controller
{
    public function __construct()
    {
        $this->middleware('shopify.auth');
    }

    public function get(string $function_name, Request $request) : Response
    {
        $session = $request->get('shopifySession');

        $functions_response_data = null;
        $cart_transforms_response_data = null;

        try {
            $functions_response_data = ShopifyFunctions::get($session);
            $cart_transforms_response_data = ShopifyCartTransforms::get($session);
        } catch(Exception $ex) {
            return response([
                'server_error' => $ex->getMessage()
            ], 500);
        }

        $functions = collect($functions_response_data['data']['shopifyFunctions']['nodes']);
        $function = $functions->first(fn ($function) => $function['title'] == $function_name);

        if (!$function) {
            return response([
                'server_error' => "No function exists with name \"{$function_name}\""
            ], 404);
        }

        $cart_transforms = collect($cart_transforms_response_data['data']['cartTransforms']['nodes']);

        $cart_transform = $cart_transforms->first(fn ($transform) => $transform['functionId'] == $function['id']);

        return response([
            'cart_transform' => $cart_transform
        ], 200);

    }

    public function activate(string $function_name, Request $request) : Response
    {

        $session = $request->get('shopifySession');

        $functions_response_data = null;

        try {
            $functions_response_data = ShopifyFunctions::get($session);

        } catch(Exception $ex) {
            return response([
                'server_error' => $ex->getMessage()
            ], 500);
        }

        $functions = collect($functions_response_data['data']['shopifyFunctions']['nodes']);
        $function = $functions->first(fn ($function) => $function['title'] == $function_name);

        if (!$function) {
            return response([
                'server_error' => "No function exists with name \"{$function_name}\""
            ], 404);
        }

        try {
            $create_response = ShopifyCartTransforms::create($session, $function['id']);
        } catch(Exception $ex) {
            return response([
                'server_error' => $ex->getMessage()
            ], 500);
        }

        return response([
            'cart_transform' => $create_response['data']['cartTransformCreate']['cartTransform']
        ], 200);
    }

    public function deactivate(Request $request) : Response
    {

        $session = $request->get('shopifySession');

        $validator = Validator::make($request->all(), [
            'id' => ['required', 'string', 'starts_with:gid://shopify/CartTransform/'],
        ]);

        if ($validator->fails()) {
            return response([
                'field_errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        try {
            $delete_response = ShopifyCartTransforms::delete($session, $validated['id']);
        } catch(Exception $ex) {
            return response([
                'server_error' => $ex->getMessage()
            ], 500);
        }

        return response([
            'cart_transform' => null,
            'delete_id' => $delete_response['data']['cartTransformDelete']['deletedId']
        ], 200);
    }

}
