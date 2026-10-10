<?php

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CommuneController;
use App\Http\Controllers\Api\WilayaController;
use App\Http\Controllers\Api\EtablissementController;
use App\Http\Controllers\Api\PartyMemberController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return User::with('etablissement')->find($request->user()->id);
    });
});

// USER ROUTES
Route::middleware('auth:sanctum')->group(function () {

Route::get('/users/count/{etablissement_id}', [UserController::class, 'getCount']);
Route::post('/users/bulk-delete', [UserController::class, 'bulkDelete']);
Route::get('/users/{id}', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}/{user}', [UserController::class, 'show']);
Route::put('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);
Route::apiResource('/users', UserController::class);
});

// COMMUNES ROUTES
Route::middleware('auth:sanctum')->group(function () {
Route::get('/communes/count', [CommuneController::class, 'getCount']);
Route::post('/communes/bulk-delete', [CommuneController::class, 'bulkDelete']);
Route::get('/communes/dropdown', [CommuneController::class, 'getAllForDropdown']);
Route::get('/communesw/{id}', [CommuneController::class, 'getcommunes']);
Route::apiResource('/communes', CommuneController::class);

// WILAYAS ROUTES
Route::get('/wilayas/count', [WilayaController::class, 'getCount']);
Route::post('/wilayas/bulk-delete', [WilayaController::class, 'bulkDelete']);
Route::get('/wilayas/dropdown', [WilayaController::class, 'getAllForDropdown']);
Route::get('/countlanding', [WilayaController::class, 'countlanding']);
Route::apiResource('/wilayas', WilayaController::class);


// ETABLISSEMENTS ROUTES
Route::get('/etablissements/count', [EtablissementController::class, 'getCount']);
Route::post('/etablissements/bulk-delete', [EtablissementController::class, 'bulkDelete']);
Route::post('/etablissements/{id}/upload-logo', [EtablissementController::class, 'uploadLogo']);
Route::delete('/etablissements/{id}/delete-logo', [EtablissementController::class, 'deleteLogo']);
Route::put('/etablissements/{id}/parameters', [EtablissementController::class, 'updateParameters']);

});
Route::apiResource('/etablissements', EtablissementController::class);


// AUTH ROUTES
Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/login/{id}', [AuthController::class, 'login']);

// PARTY MEMBER ROUTES (public)
Route::post('/party-members/register', [PartyMemberController::class, 'register']);
Route::get('/party-members/top-referrers', [PartyMemberController::class, 'getTopReferrers']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/party-members/count', [PartyMemberController::class, 'getStats']);

    Route::get('/party-members', [PartyMemberController::class, 'index']);
    Route::get('/party-members-list/{etablissement_id}', [PartyMemberController::class, 'index']);
    Route::get('/party-members/{id}', [PartyMemberController::class, 'show']);
    Route::put('/party-members/{id}/state', [PartyMemberController::class, 'updateState']);
    Route::post('/party-members/{id}/regenerate-token', [PartyMemberController::class, 'regenerateToken']);
    Route::get('/party-members/{id}/referral-stats', [PartyMemberController::class, 'getReferralStats']);
});
