<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => ['user' => $request->user()?->only('id', 'name', 'email', 'role', 'room')],
            'building' => config('roomfix.building'),
            'demo' => config('roomfix.demo') && (app()->environment('local', 'testing') || config('roomfix.isolated_demo')),
            'isolated_demo' => (bool) config('roomfix.isolated_demo'),
            'unread' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
            'flash' => ['success' => fn () => $request->session()->get('success')],
        ];
    }
}
