<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;

    private User $owner;

    private User $tech;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->startOfMinute());
        $this->manager = User::factory()->create(['role' => 'manager']);
        $this->owner = User::factory()->create(['role' => 'resident', 'room' => 'A-203']);
        $this->tech = User::factory()->create(['role' => 'technician']);
    }

    private function job(?User $owner = null): Ticket
    {
        $owner ??= $this->owner;

        return Ticket::create(['resident_id' => $owner->id, 'room' => $owner->room, 'assignee_id' => $this->tech->id, 'status' => 'assigned', 'title' => 'ซ่อมก๊อกน้ำรั่ว', 'description' => 'น้ำรั่วตรงอ่างล้างหน้า', 'category' => 'plumbing', 'urgency' => 'normal'])->fresh();
    }

    private function proposal(Ticket $ticket, array $extra = []): array
    {
        return array_merge(['action' => 'propose', 'version' => $ticket->fresh()->appointment_version, 'start' => now()->addDay()->setTimezone('Asia/Bangkok')->toIso8601String(), 'end' => now()->addDay()->addHour()->setTimezone('Asia/Bangkok')->toIso8601String(), 'note' => 'เตรียมพื้นที่ใต้ซิงก์'], $extra);
    }

    public function test_manager_proposes_owner_confirms_and_technician_can_then_start(): void
    {
        $ticket = $this->job();
        $this->actingAs($this->manager)->post("/tickets/$ticket->id/appointment", $this->proposal($ticket))->assertRedirect();
        $this->assertSame('pending', $ticket->fresh()->appointment_status);
        $this->assertSame(now()->addDay()->timestamp, $ticket->fresh()->appointment_start->timestamp);
        $this->assertSame('UTC', $ticket->fresh()->appointment_start->timezoneName);
        $this->assertSame(1, $this->owner->notifications()->count());
        $this->actingAs($this->tech)->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertSessionHasErrors('action');
        $this->actingAs($this->owner)->post("/tickets/$ticket->id/appointment", ['action' => 'confirm', 'version' => 1])->assertRedirect();
        $this->assertSame('confirmed', $ticket->fresh()->appointment_status);
        $this->assertSame(['appointment_propose', 'appointment_confirm'], $ticket->events()->pluck('action')->all());
        $this->actingAs($this->tech)->post("/tickets/$ticket->id/transition", ['action' => 'start'])->assertRedirect();
        $this->assertSame('in_progress', $ticket->fresh()->status);
    }

    public function test_only_manager_can_propose_and_only_owner_can_answer(): void
    {
        $ticket = $this->job();
        $other = User::factory()->create(['role' => 'resident', 'room' => 'B-401']);
        foreach ([$this->owner, $other, $this->tech] as $user) {
            $this->actingAs($user)->post("/tickets/$ticket->id/appointment", $this->proposal($ticket))->assertForbidden();
        }
        $this->actingAs($this->manager)->post("/tickets/$ticket->id/appointment", $this->proposal($ticket));
        foreach ([$this->manager, $other, $this->tech] as $user) {
            $this->actingAs($user)->post("/tickets/$ticket->id/appointment", ['action' => 'confirm', 'version' => 1])->assertForbidden();
        }
        $this->actingAs($other)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->has('upcoming', 0));
        $this->assertSame('pending', $ticket->fresh()->appointment_status);
    }

    public function test_overlapping_bookings_are_rejected_but_adjacent_slots_are_allowed(): void
    {
        $first = $this->job();
        $second = $this->job();
        $this->actingAs($this->manager)->post("/tickets/$first->id/appointment", $this->proposal($first))->assertRedirect();
        $this->post("/tickets/$second->id/appointment", $this->proposal($second))->assertSessionHasErrors('appointment');
        $this->assertNull($second->fresh()->appointment_status);
        $this->assertDatabaseCount('ticket_events', 1);
        $this->post("/tickets/$second->id/appointment", $this->proposal($second, ['start' => now()->addDay()->addHour()->toIso8601String(), 'end' => now()->addDay()->addHours(2)->toIso8601String()]))->assertRedirect();
        $this->assertSame('pending', $second->fresh()->appointment_status);
    }

    public function test_decline_requires_reason_and_releases_the_reserved_slot(): void
    {
        $first = $this->job();
        $this->actingAs($this->manager)->post("/tickets/$first->id/appointment", $this->proposal($first));
        $this->actingAs($this->owner)->post("/tickets/$first->id/appointment", ['action' => 'decline', 'version' => 1])->assertSessionHasErrors('note');
        $this->post("/tickets/$first->id/appointment", ['action' => 'decline', 'version' => 1, 'note' => 'สะดวกหลังห้าโมงเย็น'])->assertRedirect();
        $this->assertSame('declined', $first->fresh()->appointment_status);
        $second = $this->job();
        $this->actingAs($this->manager)->post("/tickets/$second->id/appointment", $this->proposal($second))->assertRedirect();
        $this->assertSame('pending', $second->fresh()->appointment_status);
    }

    public function test_old_browser_cannot_confirm_a_rescheduled_or_reassigned_appointment(): void
    {
        $ticket = $this->job();
        $this->actingAs($this->manager)->post("/tickets/$ticket->id/appointment", $this->proposal($ticket));
        $this->post("/tickets/$ticket->id/appointment", $this->proposal($ticket, ['start' => now()->addDays(2)->toIso8601String(), 'end' => now()->addDays(2)->addHour()->toIso8601String()]))->assertRedirect();
        $this->actingAs($this->owner)->post("/tickets/$ticket->id/appointment", ['action' => 'confirm', 'version' => 1])->assertSessionHasErrors('appointment');
        $this->assertSame('pending', $ticket->fresh()->appointment_status);
        $newTech = User::factory()->create(['role' => 'technician']);
        $this->actingAs($this->manager)->post("/tickets/$ticket->id/assign", ['assignee_id' => $newTech->id])->assertRedirect();
        $this->assertNull($ticket->fresh()->appointment_status);
        $this->assertNull($ticket->fresh()->appointment_start);
        $this->actingAs($this->owner)->post("/tickets/$ticket->id/appointment", ['action' => 'confirm', 'version' => 2])->assertSessionHasErrors('appointment');
    }

    public function test_completed_work_cannot_be_booked_or_answered_and_cancel_has_history(): void
    {
        $ticket = $this->job();
        $this->actingAs($this->manager)->post("/tickets/$ticket->id/appointment", $this->proposal($ticket));
        $this->post("/tickets/$ticket->id/appointment", ['action' => 'cancel', 'version' => 1])->assertRedirect();
        $this->assertSame('cancelled', $ticket->fresh()->appointment_status);
        $this->assertSame(['appointment_propose', 'appointment_cancel'], $ticket->events()->pluck('action')->all());
        $ticket->update(['status' => 'closed']);
        $this->post("/tickets/$ticket->id/appointment", $this->proposal($ticket))->assertSessionHasErrors('appointment');
        $this->actingAs($this->owner)->post("/tickets/$ticket->id/appointment", ['action' => 'confirm', 'version' => 2])->assertSessionHasErrors('appointment');
        $this->assertSame('closed', $ticket->fresh()->status);
    }

    public function test_selecting_the_same_technician_preserves_the_confirmed_appointment(): void
    {
        $ticket = $this->job();
        $this->actingAs($this->manager)->post("/tickets/$ticket->id/appointment", $this->proposal($ticket));
        $this->actingAs($this->owner)->post("/tickets/$ticket->id/appointment", ['action' => 'confirm', 'version' => 1]);
        $this->actingAs($this->manager)->post("/tickets/$ticket->id/assign", ['assignee_id' => $this->tech->id])->assertRedirect();
        $this->assertSame('confirmed', $ticket->fresh()->appointment_status);
        $this->assertSame(2, $ticket->fresh()->appointment_version);
        $this->assertDatabaseCount('ticket_events', 2);
    }

    public function test_invalid_duration_past_ambiguous_and_excessively_future_dates_are_rejected(): void
    {
        $ticket = $this->job();
        $this->actingAs($this->manager);
        $this->post("/tickets/$ticket->id/appointment", $this->proposal($ticket, ['end' => now()->addDay()->addHours(5)->toIso8601String()]))->assertSessionHasErrors('appointment');
        $this->post("/tickets/$ticket->id/appointment", $this->proposal($ticket, ['start' => now()->subHour()->toIso8601String()]))->assertSessionHasErrors('start');
        $this->post("/tickets/$ticket->id/appointment", $this->proposal($ticket, ['start' => '2026-10-09T09:00:00']))->assertSessionHasErrors('start');
        $this->post("/tickets/$ticket->id/appointment", $this->proposal($ticket, ['start' => now()->addDays(91)->toIso8601String(), 'end' => now()->addDays(91)->addHour()->toIso8601String()]))->assertSessionHasErrors('start');
        $this->assertDatabaseCount('ticket_events', 0);
        $this->assertSame(0, $ticket->fresh()->appointment_version);
    }

    public function test_overdue_filter_matches_dashboard_and_keeps_owner_scope(): void
    {
        $old = $this->job();
        $old->forceFill(['created_at' => now()->subDays(4)])->save();
        $closed = $this->job();
        $closed->forceFill(['created_at' => now()->subDays(4), 'status' => 'closed'])->save();
        $this->job();
        $other = User::factory()->create(['role' => 'resident', 'room' => 'B-401']);
        $this->job($other)->forceFill(['created_at' => now()->subDays(5)])->save();
        $this->actingAs($this->owner)->get('/tickets?overdue=1')->assertInertia(fn (Assert $page) => $page->has('tickets.data', 1)->where('tickets.data.0.id', $old->id));
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('overdue', 1));
    }
}
