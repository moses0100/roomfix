<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $query = Ticket::visibleTo($request->user());
        $counts = (clone $query)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $recent = (clone $query)->with(['resident:id,name', 'assignee:id,name'])->latest()->limit(6)->get();
        $categories = (clone $query)->selectRaw('category, count(*) as total')->groupBy('category')->get();
        $overdue = (clone $query)->whereIn('status', ['new', 'assigned', 'in_progress', 'reopened'])->where('created_at', '<', now()->subDays(3))->count();

        return Inertia::render('Dashboard', compact('counts', 'recent', 'categories', 'overdue'));
    }
}
