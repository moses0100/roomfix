<?php

namespace App\Http\Middleware;

use App\Services\DemoSandbox;
use Closure;
use Illuminate\Http\Request;

class EnsureDemoSandbox
{
    public function handle(Request $request, Closure $next)
    {
        if (config('roomfix.isolated_demo')) {
            $sandbox = app(DemoSandbox::class);
            try {
                $sandbox->assertIsolated();
            } catch (\RuntimeException $exception) {
                report($exception);
                abort(503, 'โหมดเดโมยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแล');
            }
            $sandbox->lock(false);
            try {
                return $next($request);
            } finally {
                $sandbox->unlock(false);
            }
        }

        return $next($request);
    }
}
