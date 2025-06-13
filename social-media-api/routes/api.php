<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SocialMediaProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:api')->group(function () {
    // Auth routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Social Media Profile routes
    Route::apiResource('social-media-profiles', SocialMediaProfileController::class);
    
    // Additional profile routes
    Route::get('/social-media-profiles-by-platform', [SocialMediaProfileController::class, 'byPlatform']);
    Route::post('/social-media-profiles/{socialMediaProfile}/sync', [SocialMediaProfileController::class, 'sync']);
});

// Health check route
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()->toISOString()
    ]);
});

// OpenAPI documentation endpoints
Route::get('/openapi.yaml', function () {
    return response()->file(base_path('openapi.yaml'), [
        'Content-Type' => 'application/x-yaml'
    ]);
});

Route::get('/openapi.json', function () {
    return response()->file(base_path('openapi.json'), [
        'Content-Type' => 'application/json'
    ]);
});