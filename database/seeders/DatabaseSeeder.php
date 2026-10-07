<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Production databases start empty. DemoSeeder is explicitly opt-in.
        $this->command?->info('No default accounts created. Use roomfix:manager or DemoSeeder locally.');
    }
}
