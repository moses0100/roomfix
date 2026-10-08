<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    private function job(string $created, string $status = 'new', string $title = 'น้ำรั่ว'): Ticket
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $ticket = Ticket::create(['resident_id' => $resident->id, 'room' => 'A-203', 'title' => $title, 'description' => 'ตรวจสอบน้ำรั่ว', 'category' => 'plumbing', 'urgency' => 'normal', 'status' => $status]);
        $ticket->forceFill(['created_at' => $created])->save();

        return $ticket;
    }

    public function test_reports_and_exports_are_manager_only(): void
    {
        $this->get('/reports')->assertRedirect('/login');
        $this->get('/reports/export')->assertRedirect('/login');
        foreach (['resident', 'technician'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->get('/reports')->assertForbidden();
            $this->get('/reports/export')->assertForbidden();
        }
    }

    public function test_report_uses_inclusive_thai_days_and_current_status_for_the_created_cohort(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 8));
        $this->job('2026-09-30 16:59:59');
        $this->job('2026-09-30 17:00:00');
        $this->job('2026-10-01 16:59:59', 'closed');
        $this->job('2026-10-01 17:00:00');
        $this->actingAs(User::factory()->create(['role' => 'manager']))->get('/reports?from=2026-10-01&to=2026-10-01')
            ->assertInertia(fn (Assert $page) => $page->component('Reports')->where('total', 2)->where('counts.new', 1)->where('counts.closed', 1)->where('categories.plumbing', 2)->where('overdue', 1));
    }

    public function test_invalid_reversed_future_and_empty_dates_are_rejected(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'manager']));
        foreach (['from=wrong&to=wrong', 'from=2026-10-02&to=2026-10-01', 'from=&to=', 'from=2099-01-01&to=2099-01-02'] as $query) {
            $this->get('/reports?'.$query)->assertSessionHasErrors();
            $this->get('/reports/export?'.$query)->assertSessionHasErrors();
        }
    }

    public function test_csv_matches_date_filter_preserves_thai_and_neutralizes_formulas(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 8));
        $this->job('2026-09-30 17:00:00', 'new', ' =HYPERLINK("bad")');
        $this->job('2026-10-01 12:00:00', 'closed', 'น้ำรั่ว, มีเสียง');
        $this->job('2026-10-01 17:00:00', 'new', 'excluded');
        $response = $this->actingAs(User::factory()->create(['role' => 'manager']))->get('/reports/export?from=2026-10-01&to=2026-10-01');
        $response->assertOk()->assertDownload('roomfix-2026-10-01-to-2026-10-01.csv');
        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $stream = fopen('php://memory', 'r+');
        fwrite($stream, substr($content, 3));
        rewind($stream);
        $rows = [];
        while (($row = fgetcsv($stream, null, ',', '"', '')) !== false) {
            $rows[] = $row;
        }
        fclose($stream);
        $this->assertCount(3, $rows);
        $this->assertSame("' =HYPERLINK(\"bad\")", $rows[1][1]);
        $this->assertSame('2026-10-01 00:00', $rows[1][6]);
        $this->assertSame('น้ำรั่ว, มีเสียง', $rows[2][1]);
        $this->assertStringNotContainsString('excluded', $content);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }
}
