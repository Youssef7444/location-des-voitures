<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Car Rental API',
        'version' => '1.0.0',
        'documentation' => '/api/docs',
    ]);
});

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// API documentation
Route::get('/api/docs', function () {
    return response()->json([
        'api' => 'Car Rental Platform API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/auth',
            'users' => '/api/users',
            'cars' => '/api/cars',
            'reservations' => '/api/reservations',
            'payments' => '/api/payments',
        ],
    ]);
});