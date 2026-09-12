<?php

namespace App\Http\Controllers\Api;
use Illuminate\Support\Facades\Log;

use App\Http\Controllers\Controller;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{

    public function login(LoginRequest $request,$appmode)
    {
        
        $credentials = $request->validated();

       if(!Auth::attempt($credentials)){
        return response([
            'message' => 'provided information are incorrect'
        ],422);
       }

       $user=Auth::user();

        if ($user->app_id != $appmode) {
        if ($user->app_id != $appmode) {
            return response(['message' => 'لا تملك حساب في هذه المنصة'], 401); // Return 401 Unauthorized
        }
       }

       $token= $user->createToken('main')->plainTextToken;
        return response(compact('user', 'token'));
    }
    // logout
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();
        return response([
            'message' => 'Successfully logged out'
        ], 200);
    }
}
