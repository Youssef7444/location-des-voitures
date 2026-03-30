<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\CarImageController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\InsuranceTypeController;
use App\Http\Controllers\MaintenanceLogController;
use App\Http\Controllers\DamageReportController;
use App\Http\Controllers\DocumentController;

// Public auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/company-register', [AuthController::class, 'companyRegister']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public browsing
Route::get('/cars/search', [CarController::class, 'search']);
Route::get('/cars', [CarController::class, 'index']);
Route::get('/cars/{id}', [CarController::class, 'show']);
Route::get('/cars/{id}/reviews', [ReviewController::class, 'carReviews']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/cities', [CityController::class, 'index']);
Route::get('/companies', [CompanyController::class, 'index']);
Route::get('/companies/{id}', [CompanyController::class, 'show']);
Route::get('/insurance-types', [InsuranceTypeController::class, 'index']);

Route::middleware('auth:api')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // User profile
    Route::get('/user/profile', [AuthController::class, 'me']);
    Route::post('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);
    Route::get('/user/reservations', [ReservationController::class, 'userReservations']);

    // User business actions
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/{id}', [ReservationController::class, 'show']);
    Route::put('/reservations/{id}', [ReservationController::class, 'update']);
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'destroy']);

    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/{id}', [NotificationController::class, 'show']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread/count', [NotificationController::class, 'unreadCount']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments', [PaymentController::class, 'userPayments']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::post('/payments/{id}/refund', [PaymentController::class, 'refund']);

    Route::post('/damage-reports', [DamageReportController::class, 'store']);
    Route::get('/damage-reports/{id}', [DamageReportController::class, 'show']);

    // Admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('companies', CompanyController::class);
        Route::post('/companies/{id}/logo', [CompanyController::class, 'uploadLogo']);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('cities', CityController::class);
        Route::apiResource('insurance-types', InsuranceTypeController::class);

        Route::get('/reservations', [ReservationController::class, 'index']);
        Route::post('/reservations/{id}/status', [ReservationController::class, 'updateStatus']);

        Route::get('/payments', [PaymentController::class, 'index']);
        Route::get('/payments/stats', [PaymentController::class, 'stats']);

        Route::get('/damage-reports', [DamageReportController::class, 'index']);
        Route::post('/damage-reports/{id}/status', [DamageReportController::class, 'updateStatus']);

        Route::post('/documents/{id}/verify', [DocumentController::class, 'verify']);
    });

    // Company
    Route::middleware('role:company')->prefix('company')->group(function () {
        Route::post('/cars', [CarController::class, 'store']);
        Route::put('/cars/{id}', [CarController::class, 'update']);
        Route::delete('/cars/{id}', [CarController::class, 'destroy']);

        Route::get('/car-images', [CarImageController::class, 'index']);
        Route::get('/car-images/{id}', [CarImageController::class, 'show']);
        Route::post('/car-images', [CarImageController::class, 'store']);
        Route::delete('/car-images/{id}', [CarImageController::class, 'destroy']);

        Route::get('/maintenance-logs', [MaintenanceLogController::class, 'index']);
        Route::get('/maintenance-logs/{id}', [MaintenanceLogController::class, 'show']);
        Route::post('/maintenance-logs', [MaintenanceLogController::class, 'store']);
        Route::put('/maintenance-logs/{id}', [MaintenanceLogController::class, 'update']);
        Route::delete('/maintenance-logs/{id}', [MaintenanceLogController::class, 'destroy']);
        Route::get('/cars/{id}/maintenance-logs', [MaintenanceLogController::class, 'carLogs']);

        Route::get('/reservations', [ReservationController::class, 'companyReservations']);
        Route::get('/payments', [PaymentController::class, 'companyPayments']);
        Route::get('/stats', [PaymentController::class, 'stats']);
    });
});
