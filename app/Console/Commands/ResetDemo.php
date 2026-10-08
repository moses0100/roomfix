<?php

namespace App\Console\Commands;

use App\Services\DemoSandbox;
use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetDemo extends Command
{
    protected $signature = 'roomfix:demo-reset {--confirm= : Must equal roomfix_demo}';

    protected $description = 'Restore sample data in the dedicated demo database only';

    public function handle(DemoSandbox $sandbox): int
    {
        try {
            $sandbox->assertIsolated();
        } catch (\RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
        if ($this->option('confirm') !== 'roomfix_demo') {
            $this->error('Pass --confirm=roomfix_demo to reset fictional demo data.');

            return self::FAILURE;
        }
        if (app()->isDownForMaintenance()) {
            $this->error('Already in maintenance mode; existing state preserved.');

            return self::FAILURE;
        }
        $this->callSilent('down', ['--retry' => 30]);
        try {
            // Wait for in-flight web requests before replacing sample data.
            $sandbox->lock(true);
            DB::transaction(function () {
                foreach (['ticket_events', 'ticket_photos', 'tickets', 'notifications', 'sessions', 'password_reset_tokens', 'users'] as $table) {
                    DB::table($table)->delete();
                }
                app(DemoSeeder::class)->run();
            });
        } finally {
            $sandbox->unlock(true);
            $this->callSilent('up');
        }
        $this->info('Demo restored: 4 accounts and 6 tickets. Sessions invalidated.');
        $this->line('Uploaded files retained in the isolated demo volume; no production data or files touched.');

        return self::SUCCESS;
    }
}
