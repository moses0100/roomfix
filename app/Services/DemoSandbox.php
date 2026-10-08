<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DemoSandbox
{
    public function lock(bool $exclusive): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::select($exclusive ? 'select pg_advisory_lock(8240317)' : 'select pg_advisory_lock_shared(8240317)');
        }
    }

    public function unlock(bool $exclusive): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::select($exclusive ? 'select pg_advisory_unlock(8240317)' : 'select pg_advisory_unlock_shared(8240317)');
        }
    }

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
