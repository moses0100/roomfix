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
            try {
                app(DemoSandbox::class)->assertIsolated();
            } catch (\RuntimeException $exception) {
                report($exception);
                abort(503, 'โหมดเดโมยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแล');
            }
        }

        return $next($request);
    }
}
