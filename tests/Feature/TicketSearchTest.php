<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TicketSearchTest extends TestCase
{
    use RefreshDatabase;

    private function job(User $resident, string $title, string $room): Ticket
    {
        return Ticket::create(['resident_id' => $resident->id, 'room' => $room, 'title' => $title, 'description' => 'ตรวจสอบอุปกรณ์ภายในห้อง', 'category' => 'other', 'urgency' => 'normal']);
    }

    public function test_zero_search_matches_titles_and_rooms_without_returning_other_jobs(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $titleMatch = $this->job($resident, 'หน้าจอแสดงเลข 0', 'A-111');
        $roomMatch = $this->job($resident, 'ประตูชำรุด', 'A-203');
        $this->job($resident, 'ไฟเสีย', 'B-111');

        $this->actingAs(User::factory()->create(['role' => 'manager']))->get('/tickets?q=0')
            ->assertInertia(fn (Assert $page) => $page->component('Tickets')
                ->where('filters.q', '0')->where('tickets.total', 2)
                ->where('tickets.data', fn ($tickets) => collect($tickets)->pluck('id')->sort()->values()->all() === [$titleMatch->id, $roomMatch->id]));
    }

    public function test_zero_search_preserves_resident_visibility_for_both_search_fields(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $other = User::factory()->create(['role' => 'resident']);
        $own = $this->job($resident, 'หน้าจอแสดงเลข 0', 'A-111');
        $this->job($resident, 'ไฟเสีย', 'A-111');
        $this->job($other, 'หน้าจอแสดงเลข 0', 'B-111');
        $this->job($other, 'ประตูชำรุด', 'B-203');

        $this->actingAs($resident)->get('/tickets?q=0')
            ->assertInertia(fn (Assert $page) => $page->component('Tickets')
                ->where('tickets.total', 1)->where('tickets.data.0.id', $own->id));
    }

    public function test_empty_search_still_lists_all_visible_jobs(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $this->job($resident, 'ไฟเสีย', 'A-111');
        $this->job($resident, 'ประตูชำรุด', 'A-203');
        foreach (['/tickets', '/tickets?q='] as $url) {
            $this->actingAs($resident)->get($url)
                ->assertInertia(fn (Assert $page) => $page->component('Tickets')->where('tickets.total', 2));
        }
    }

    public static function literalSearchTerms(): array
    {
        return [['%'], ['_'], ['!'], ['!%'], ['\\']];
    }

    #[DataProvider('literalSearchTerms')]
    public function test_literal_search_matches_special_characters_in_titles_and_rooms(string $term): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $titleMatch = $this->job($resident, 'หน้าจอแสดง '.$term, 'A-111');
        $roomMatch = $this->job($resident, 'ประตูชำรุด', 'B'.$term.'222');
        $this->job($resident, 'ไฟเสีย', 'C-333');
        $this->actingAs(User::factory()->create(['role' => 'manager']))->get('/tickets?q='.rawurlencode($term))
            ->assertInertia(fn (Assert $page) => $page->component('Tickets')
                ->where('filters.q', $term)->where('tickets.total', 2)
                ->where('tickets.data', fn ($tickets) => collect($tickets)->pluck('id')->sort()->values()->all() === [$titleMatch->id, $roomMatch->id]));
    }

    public function test_literal_search_still_restricts_residents_to_their_own_jobs(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);
        $other = User::factory()->create(['role' => 'resident']);
        $own = $this->job($resident, 'หน้าจอแสดง 10%', 'A-111');
        $this->job($resident, 'ไฟเสีย', 'A-111');
        $this->job($other, 'หน้าจอแสดง 10%', 'B-111');
        $this->job($other, 'ประตูชำรุด', 'B%222');
        $this->actingAs($resident)->get('/tickets?q=%25')
            ->assertInertia(fn (Assert $page) => $page->component('Tickets')
                ->where('tickets.total', 1)->where('tickets.data.0.id', $own->id));
    }
}
