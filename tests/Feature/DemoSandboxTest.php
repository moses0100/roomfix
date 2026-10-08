<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DemoSandbox;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoSandboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_isolated_demo_requires_both_explicit_flags(): void
    {
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => false]);
        $this->expectException(\RuntimeException::class);
        app(DemoSandbox::class)->assertIsolated();
    }

    public function test_operator_check_is_read_only_in_both_modes(): void
    {
        User::factory()->create();
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => false]);
        $this->artisan('roomfix:demo-check')->assertFailed();
        config(['roomfix.isolated_demo' => true]);
        $this->artisan('roomfix:demo-check')->assertSuccessful();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_misconfigured_demo_stops_web_access(): void
    {
        config(['roomfix.demo' => false, 'roomfix.isolated_demo' => true]);
        $this->get('/login')->assertStatus(503);
    }

    public function test_demo_users_cannot_change_passwords_or_create_accounts(): void
    {
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => true]);
        $manager = User::factory()->create(['role' => 'manager', 'password' => 'OriginalPass!2026']);
        $this->actingAs($manager)->post('/settings/password', ['current_password' => 'OriginalPass!2026', 'password' => 'DifferentPass!2026', 'password_confirmation' => 'DifferentPass!2026'])->assertForbidden();
        $this->post('/users', ['name' => 'extra', 'email' => 'extra@roomfix.test', 'role' => 'technician', 'password' => 'DifferentPass!2026'])->assertForbidden();
        $this->assertTrue(Hash::check('OriginalPass!2026', $manager->fresh()->password));
        $this->assertDatabaseCount('users', 1);
    }

    public function test_normal_mode_still_allows_account_management(): void
    {
        config(['roomfix.isolated_demo' => false]);
        $manager = User::factory()->create(['role' => 'manager', 'password' => 'OriginalPass!2026']);
        $this->actingAs($manager)->post('/settings/password', ['current_password' => 'OriginalPass!2026', 'password' => 'DifferentPass!2026', 'password_confirmation' => 'DifferentPass!2026'])->assertRedirect();
        $this->post('/users', ['name' => 'extra', 'email' => 'extra@roomfix.test', 'role' => 'technician', 'password' => 'DifferentPass!2026'])->assertRedirect();
        $this->assertTrue(Hash::check('DifferentPass!2026', $manager->fresh()->password));
        $this->assertDatabaseCount('users', 2);
    }

    public function test_production_cannot_use_the_in_memory_exception_or_debug_mode(): void
    {
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => true, 'app.debug' => false]);
        app()->instance('env', 'production');
        $this->expectException(\RuntimeException::class);
        app(DemoSandbox::class)->assertIsolated();
    }

    public function test_production_demo_refuses_debug_output(): void
    {
        config(['roomfix.demo' => true, 'roomfix.isolated_demo' => true, 'app.debug' => true]);
        app()->instance('env', 'production');
        $this->expectExceptionMessage('Production demo requires APP_DEBUG=false.');
        app(DemoSandbox::class)->assertIsolated();
    }
}
