<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoomFixTest extends TestCase
{
    use RefreshDatabase;

    private function person(string $role = 'resident', ?string $room = 'A-203'): User
    {
        return User::factory()->create(['role' => $role, 'room' => $role === 'resident' ? $room : null]);
    }

    private function ticket(User $owner, array $extra = []): Ticket
    {
        return Ticket::create(array_merge(['resident_id' => $owner->id, 'room' => $owner->room, 'title' => 'ก๊อกน้ำห้องน้ำรั่ว', 'description' => 'น้ำหยดตลอดทั้งวัน กรุณาตรวจสอบ', 'category' => 'plumbing', 'urgency' => 'normal'], $extra));
    }

    private function payload(array $extra = []): array
    {
        return array_merge(['title' => 'ก๊อกน้ำห้องน้ำรั่ว', 'description' => 'น้ำหยดตลอดทั้งวัน กรุณาตรวจสอบ', 'category' => 'plumbing', 'urgency' => 'normal'], $extra);
    }

    private function png(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('problem.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9kAAAAASUVORK5CYII='));
    }

    public function test_complete_workflow_has_audit_history_and_notifications(): void
    {
        $resident = $this->person();
        $manager = $this->person('manager');
        $tech = $this->person('technician');
        $this->actingAs($resident)->post('/tickets', $this->payload())->assertRedirect();
        $ticket = Ticket::firstOrFail();
        $this->assertSame('new', $ticket->status);
        $this->assertCount(1, $manager->notifications);
        $this->actingAs($manager)->post("/tickets/$ticket->id/assign", ['assignee_id' => $tech->id])->assertRedirect();
        $this->actingAs($tech)->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertRedirect();
        $this->post("/tickets/$ticket->id/transition", ['action' => 'finish', 'note' => 'เปลี่ยนยางก๊อกและทดสอบแล้ว'])->assertRedirect();
        $this->assertSame('awaiting_confirmation', $ticket->fresh()->status);
        $this->actingAs($resident)->post("/tickets/$ticket->id/transition", ['action' => 'confirm'])->assertRedirect();
        $this->assertSame('closed', $ticket->fresh()->status);
        $this->assertNotNull($ticket->fresh()->closed_at);
        $this->assertSame(['create', 'assign', 'start', 'finish', 'confirm'], $ticket->events()->pluck('action')->all());
        $this->assertGreaterThanOrEqual(3, $resident->notifications()->count());
        $this->assertGreaterThanOrEqual(2, $tech->notifications()->count());
    }

    public function test_owner_room_status_and_assignment_cannot_be_injected_on_create(): void
    {
        $resident = $this->person();
        $other = $this->person('resident', 'B-401');
        $this->actingAs($resident)->post('/tickets', $this->payload(['resident_id' => $other->id, 'room' => 'B-401', 'status' => 'closed', 'assignee_id' => $other->id]))->assertRedirect();
        $ticket = Ticket::firstOrFail();
        $this->assertSame($resident->id, $ticket->resident_id);
        $this->assertSame('A-203', $ticket->room);
        $this->assertSame('new', $ticket->status);
        $this->assertNull($ticket->assignee_id);
        $this->actingAs($this->person('technician'))->post('/tickets', $this->payload())->assertForbidden();
        $this->actingAs($this->person('resident', null))->post('/tickets', $this->payload())->assertForbidden();
    }

    public function test_other_residents_and_unassigned_technicians_cannot_read_or_comment(): void
    {
        $owner = $this->person();
        $ticket = $this->ticket($owner);
        foreach ([$this->person('resident', 'B-401'), $this->person('technician')] as $outsider) {
            $this->actingAs($outsider)->get("/tickets/$ticket->id")->assertForbidden();
            $this->post("/tickets/$ticket->id/comments", ['message' => 'ไม่ควรเพิ่มได้'])->assertForbidden();
            $this->get('/tickets')->assertInertia(fn (Assert $page) => $page->component('Tickets')->has('tickets.data', 0));
            $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->has('recent', 0));
        }
        $this->actingAs($owner)->get("/tickets/$ticket->id")->assertOk();
        $this->actingAs($this->person('manager'))->get("/tickets/$ticket->id")->assertOk();
    }

    public function test_photos_are_private_and_cannot_be_substituted_from_another_ticket(): void
    {
        Storage::fake('local');
        $owner = $this->person();
        $other = $this->person('resident', 'B-401');
        $this->actingAs($owner)->post('/tickets', $this->payload(['photos' => [$this->png()]]))->assertRedirect();
        $ticket = Ticket::firstOrFail();
        $photo = $ticket->photos()->firstOrFail();
        Storage::disk('local')->assertExists($photo->path);
        $this->get("/tickets/$ticket->id/photos/$photo->id")->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->get("/tickets/$ticket->id")->assertInertia(fn (Assert $page) => $page->missing('ticket.photos.0.path'));
        $this->actingAs($other)->get("/tickets/$ticket->id/photos/$photo->id")->assertForbidden();
        $ownTicket = $this->ticket($other);
        $this->get("/tickets/$ownTicket->id/photos/$photo->id")->assertNotFound();
        $this->get('/storage/'.$photo->path)->assertNotFound();
        $this->actingAs($owner)->post('/logout')->assertRedirect('/login');
        $this->get("/tickets/$ticket->id/photos/$photo->id")->assertRedirect('/login');
    }

    public function test_svg_non_images_and_excessive_photos_are_rejected_without_creating_ticket(): void
    {
        Storage::fake('local');
        $this->actingAs($this->person());
        $this->post('/tickets', $this->payload(['photos' => [UploadedFile::fake()->createWithContent('attack.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')]]))->assertSessionHasErrors('photos.0');
        $this->post('/tickets', $this->payload(['photos' => [UploadedFile::fake()->create('file.pdf', 100, 'application/pdf')]]))->assertSessionHasErrors('photos.0');
        $this->post('/tickets', $this->payload(['photos' => [$this->png(), $this->png(), $this->png()]]))->assertSessionHasErrors('photos');
        $this->assertDatabaseCount('tickets', 0);
        $this->assertEmpty(Storage::disk('local')->allFiles());
    }

    public function test_roles_and_state_machine_reject_invalid_and_duplicate_operations(): void
    {
        $owner = $this->person();
        $manager = $this->person('manager');
        $tech = $this->person('technician');
        $otherTech = $this->person('technician');
        $ticket = $this->ticket($owner);
        $this->actingAs($owner)->post("/tickets/$ticket->id/assign", ['assignee_id' => $tech->id])->assertForbidden();
        $this->actingAs($manager)->post("/tickets/$ticket->id/assign", ['assignee_id' => $owner->id])->assertSessionHasErrors('assignee_id');
        $this->post("/tickets/$ticket->id/assign", ['assignee_id' => $tech->id])->assertRedirect();
        $this->actingAs($otherTech)->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertForbidden();
        $this->actingAs($tech)->post("/tickets/$ticket->id/transition", ['action' => 'finish', 'note' => 'ทดสอบแล้วเรียบร้อย'])->assertSessionHasErrors('action');
        $this->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertRedirect();
        $this->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertSessionHasErrors('action');
        $this->actingAs($manager)->post("/tickets/$ticket->id/assign", ['assignee_id' => $otherTech->id])->assertSessionHasErrors('assignee_id');
        $this->actingAs($tech)->post("/tickets/$ticket->id/transition", ['action' => 'finish'])->assertSessionHasErrors('note');
        $this->post("/tickets/$ticket->id/transition", ['action' => 'confirm'])->assertForbidden();
        $this->assertSame('in_progress', $ticket->fresh()->status);
        $this->assertCount(2, $ticket->events);
    }

    public function test_resident_can_reopen_failed_repair_and_manager_can_reassign(): void
    {
        $owner = $this->person();
        $tech = $this->person('technician');
        $ticket = $this->ticket($owner, ['status' => 'awaiting_confirmation', 'assignee_id' => $tech->id]);
        $this->actingAs($owner)->post("/tickets/$ticket->id/transition", ['action' => 'reopen', 'note' => 'น้ำยังรั่วเหมือนเดิม'])->assertRedirect();
        $this->assertSame('reopened', $ticket->fresh()->status);
        $newTech = $this->person('technician');
        $this->actingAs($this->person('manager'))->post("/tickets/$ticket->id/assign", ['assignee_id' => $newTech->id])->assertRedirect();
        $this->assertSame($newTech->id, $ticket->fresh()->assignee_id);
        $this->actingAs($tech)->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertForbidden();
        $this->actingAs($newTech)->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertRedirect();
    }

    public function test_user_management_is_manager_only_and_cannot_create_another_manager(): void
    {
        $manager = $this->person('manager');
        $this->actingAs($this->person())->get('/users')->assertForbidden();
        $data = ['name' => 'คนพักใหม่', 'email' => 'new@roomfix.test', 'password' => 'SecurePassword!2026', 'role' => 'resident', 'room' => 'A-204'];
        $this->post('/users', $data)->assertForbidden();
        $this->actingAs($manager)->post('/users', array_merge($data, ['role' => 'manager']))->assertSessionHasErrors('role');
        $this->post('/users', $data)->assertRedirect();
        $user = User::where('email', $data['email'])->firstOrFail();
        $this->assertSame('resident', $user->role);
        $this->assertTrue(Hash::check($data['password'], $user->password));
        $this->assertArrayNotHasKey('password', $user->toArray());
        $this->get('/register')->assertNotFound();
        $this->post('/register', $data)->assertNotFound();
    }

    public function test_reading_notifications_only_marks_current_users_notifications(): void
    {
        $owner = $this->person();
        $manager = $this->person('manager');
        $tech = $this->person('technician');
        $ticket = $this->ticket($owner);
        $this->actingAs($manager)->post("/tickets/$ticket->id/assign", ['assignee_id' => $tech->id]);
        $this->actingAs($owner)->post('/notifications/read')->assertRedirect();
        $this->assertSame(0, $owner->unreadNotifications()->count());
        $this->assertSame(1, $tech->unreadNotifications()->count());
    }

    public function test_login_logout_and_password_change_require_correct_credentials(): void
    {
        $user = $this->person();
        $this->get('/dashboard')->assertRedirect('/login');
        $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $new = 'NewSecurePassword!2026';
        $data = ['current_password' => 'wrong', 'password' => $new, 'password_confirmation' => $new];
        $this->post('/settings/password', $data)->assertSessionHasErrors('current_password');
        $this->post('/settings/password', array_merge($data, ['current_password' => 'password']))->assertRedirect();
        $this->assertTrue(Hash::check($new, $user->fresh()->password));
        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_login_attempts_are_rate_limited(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->post('/login', ['email' => 'rate@roomfix.test', 'password' => 'wrong'])->assertRedirect();
        }
        $this->post('/login', ['email' => 'rate@roomfix.test', 'password' => 'wrong'])->assertStatus(429);
    }

    public function test_demo_accounts_are_never_seeded_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->expectException(\RuntimeException::class);
        (new DemoSeeder)->run();
    }

    public function test_guest_login_has_security_headers_and_no_account_secrets(): void
    {
        $this->get('/login')->assertOk()->assertHeader('X-Frame-Options', 'DENY')->assertInertia(fn (Assert $page) => $page->component('Login')->where('auth.user', null));
    }
}
