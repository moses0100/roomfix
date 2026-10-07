<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect(auth()->check() ? '/dashboard' : '/login'));
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'loginPage'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
});
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', DashboardController::class);
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/create', [TicketController::class, 'create']);
    Route::post('/tickets', [TicketController::class, 'store'])->middleware('throttle:30,1');
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
    Route::post('/tickets/{ticket}/transition', [TicketController::class, 'transition']);
    Route::post('/tickets/{ticket}/comments', [TicketController::class, 'comment'])->middleware('throttle:30,1');
    Route::get('/tickets/{ticket}/photos/{photo}', [TicketController::class, 'photo']);
    Route::get('/users', [UsersController::class, 'index']);
    Route::post('/users', [UsersController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/notifications', [NotificationsController::class, 'index']);
    Route::post('/notifications/read', [NotificationsController::class, 'read']);
    Route::get('/settings', fn () => Inertia::render('Settings'));
    Route::post('/settings/password', [AuthController::class, 'password'])->middleware('throttle:6,1');
});
