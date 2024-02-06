<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ByobController extends Controller
{

    public function __construct()
    {
        $this->middleware('cors');
    }

    public function generateSessionId()
    {
        return [
            'session_id' => (string) Str::uuid()
        ];
    }

    public function saveBoxData(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'box_id' => ['required', 'string'],
            'session_id' => ['required', 'string'],
            'box_data' => ['required', 'array']
        ]);

        if ($validator->fails()) {
            return response([
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        $path = "treatbox/byob/{$validated['session_id']}/{$validated['box_id']}.json";

        $saved = Storage::disk('s3')->put($path, json_encode($validated['box_data'], JSON_PRETTY_PRINT), 'public');

        return [
            'saved' => $saved,
            'path' => $path
        ];
    }

    public function deleteBoxData(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'box_id' => ['required', 'string'],
            'session_id' => ['required', 'string']
        ]);

        if ($validator->fails()) {
            return response([
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        $path = "treatbox/byob/{$validated['session_id']}/{$validated['box_id']}.json";

        $deleted = Storage::disk('s3')->delete($path);

        return [
            'deleted' => $deleted
        ];
    }

}
