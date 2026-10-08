<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportRequest;
use App\Models\Ticket;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;

class ReportsController extends Controller
{
    private function query(array $filters): Builder
    {
        // Use a half-open UTC interval so both selected Thai calendar days are included.
        $start = CarbonImmutable::parse($filters['from'], 'Asia/Bangkok')->startOfDay()->utc();
        $end = CarbonImmutable::parse($filters['to'], 'Asia/Bangkok')->addDay()->startOfDay()->utc();

        return Ticket::query()->where('created_at', '>=', $start)->where('created_at', '<', $end);
    }

    public function index(ReportRequest $request)
    {
        $filters = $request->validated();
        $query = $this->query($filters);
        $counts = (clone $query)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $categories = (clone $query)->selectRaw('category, count(*) as total')->groupBy('category')->pluck('total', 'category');
        $overdue = (clone $query)->overdue()->count();
        $total = (clone $query)->count();

        return Inertia::render('Reports', compact('filters', 'counts', 'categories', 'overdue', 'total'));
    }

    public function export(ReportRequest $request)
    {
        $filters = $request->validated();
        $query = $this->query($filters)->with('assignee:id,name');

        return response()->streamDownload(function () use ($query) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF"); // UTF-8 BOM for Thai text in spreadsheet apps.
            fputcsv($output, ['รหัสงาน', 'หัวข้อ', 'ห้อง', 'ประเภท', 'สถานะ', 'ช่าง', 'วันที่แจ้ง (เวลาไทย)', 'วันที่ปิด (เวลาไทย)'], ',', '"', '');
            foreach ($query->lazyById(500) as $ticket) {
                $row = [$ticket->id, $ticket->title, $ticket->room, $ticket->category, $ticket->status, $ticket->assignee?->name ?? '', $ticket->created_at->timezone('Asia/Bangkok')->format('Y-m-d H:i'), $ticket->closed_at?->timezone('Asia/Bangkok')->format('Y-m-d H:i') ?? ''];
                // Quoting CSV alone does not stop spreadsheet formula execution.
                $row = array_map(fn ($value) => is_string($value) && preg_match('/^[\s\x{FEFF}]*[=+@-]/u', $value) ? "'".$value : $value, $row);
                fputcsv($output, $row, ',', '"', '');
            }
            fclose($output);
        }, 'roomfix-'.$filters['from'].'-to-'.$filters['to'].'.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'private, no-store']);
    }
}
