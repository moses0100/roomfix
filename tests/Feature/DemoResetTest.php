<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DemoResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_normal_database_cannot_be_reset_even_with_confirmation(): void
    {
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => false]);
        User::factory()->create();
        $this->artisan('roomfix:demo-reset', ['--confirm' => 'roomfix_demo'])->assertFailed();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_reset_requires_exact_confirmation_and_preserves_data_on_refusal(): void
    {
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => true]);
        User::factory()->create();
        $this->artisan('roomfix:demo-reset')->assertFailed();
        $this->artisan('roomfix:demo-reset', ['--confirm' => 'roomfix'])->assertFailed();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_reset_restores_only_sample_data_and_invalidates_sessions(): void
    {
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => true]);
        User::factory()->create(['email' => 'extra@roomfix.test']);
        DB::table('sessions')->insert(['id' => 'old-demo-session', 'payload' => 'sample', 'last_activity' => time()]);
        $this->artisan('roomfix:demo-reset', ['--confirm' => 'roomfix_demo'])->assertSuccessful();
        $this->assertDatabaseCount('users', 4);
        $this->assertDatabaseCount('tickets', 6);
        $this->assertDatabaseCount('sessions', 0);
        $this->assertDatabaseMissing('users', ['email' => 'extra@roomfix.test']);
        $this->assertFalse(app()->isDownForMaintenance());
        $this->assertSame(2, Ticket::where('status', 'new')->count());
        $this->artisan('roomfix:demo-reset', ['--confirm' => 'roomfix_demo'])->assertSuccessful();
        $this->assertDatabaseCount('users', 4);
        $this->assertDatabaseCount('tickets', 6);
    }
}
