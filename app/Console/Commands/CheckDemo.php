<?php

namespace App\Console\Commands;

use App\Services\DemoSandbox;
use Illuminate\Console\Command;

class CheckDemo extends Command
{
    protected $signature = 'roomfix:demo-check';

    protected $description = 'Check isolated demo configuration without changing data';

    public function handle(DemoSandbox $sandbox): int
    {
        try {
            $sandbox->assertIsolated();
        } catch (\RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
        $this->info('Isolated demo configuration verified. No data changed.');

        return self::SUCCESS;
    }
}
