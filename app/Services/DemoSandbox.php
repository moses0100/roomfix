<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DemoSandbox
{
    public function assertIsolated(): void
    {
        if (! config('roomfix.demo') || ! config('roomfix.isolated_demo')) {
            throw new \RuntimeException('Isolated demo must be explicitly enabled.');
        }
        if (app()->environment('production') && config('app.debug')) {
            throw new \RuntimeException('Production demo requires APP_DEBUG=false.');
        }
        $connection = DB::connection();
        // The only SQLite exception is the in-memory feature-test database.
        if (app()->environment('testing') && $connection->getDriverName() === 'sqlite' && $connection->getDatabaseName() === ':memory:') {
            return;
        }
        if ($connection->getDriverName() !== 'pgsql' || $connection->selectOne('select current_database() as name')->name !== 'roomfix_demo') {
            throw new \RuntimeException('Isolated demo requires the dedicated PostgreSQL database roomfix_demo.');
        }
    }
}
