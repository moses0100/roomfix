<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\TransitionTicketRequest;
use App\Models\Ticket;
use App\Models\TicketPhoto;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:80', 'status' => 'nullable|in:new,assigned,in_progress,awaiting_confirmation,closed,reopened']);
        $tickets = Ticket::visibleTo($request->user())->with(['resident:id,name', 'assignee:id,name'])->withCount('photos')
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($q) => $q->where('title', 'like', '%'.$term.'%')->orWhere('room', 'like', '%'.$term.'%')))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->latest()->paginate(12)->withQueryString();

        return Inertia::render('Tickets', compact('tickets', 'filters'));
    }

    public function create()
    {
        Gate::authorize('create', Ticket::class);

        return Inertia::render('CreateTicket');
    }

    public function store(StoreTicketRequest $request, TicketService $service)
    {
        $paths = [];
        try {
            $ticket = DB::transaction(function () use ($request, $service, &$paths) {
                $data = $request->safe()->only(['title', 'description', 'category', 'urgency']);
                $ticket = Ticket::create([...$data, 'resident_id' => $request->user()->id, 'room' => $request->user()->room]);
                $ticket->events()->create(['actor_id' => $request->user()->id, 'action' => 'create', 'message' => 'ผู้พักแจ้งปัญหาและเปิดงานซ่อม']);
                foreach ($request->file('photos', []) as $photo) {
                    $path = $photo->store('ticket-photos', 'local');
                    if (! $path) {
                        throw new \RuntimeException('Cannot store photo');
                    }
                    $paths[] = $path;
                    $ticket->photos()->create(['path' => $path, 'mime' => $photo->getMimeType()]);
                }
                $service->notify($ticket, $request->user(), 'มีงานใหม่: '.$ticket->title);

                return $ticket;
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($paths);
            throw $e;
        }

        return redirect('/tickets/'.$ticket->id)->with('success', 'แจ้งซ่อมแล้ว ผู้ดูแลจะมอบหมายช่างให้คุณ');
    }

    public function show(Ticket $ticket)
    {
        Gate::authorize('view', $ticket);
        $ticket->load(['resident:id,name,room', 'assignee:id,name', 'events.actor:id,name,role', 'photos']);
        $technicians = auth()->user()->role === 'manager' ? User::where('role', 'technician')->get(['id', 'name']) : [];

        return Inertia::render('TicketDetail', compact('ticket', 'technicians'));
    }

    public function assign(Request $request, Ticket $ticket, TicketService $service)
    {
        Gate::authorize('assign', $ticket);
        $data = $request->validate(['assignee_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'technician')]]);
        $service->assign($ticket, $request->user(), $data['assignee_id']);

        return back()->with('success', 'มอบหมายช่างแล้ว');
    }

    public function transition(TransitionTicketRequest $request, Ticket $ticket, TicketService $service)
    {
        $service->transition($ticket, $request->user(), $request->validated('action'), $request->validated('note'));

        return back()->with('success', 'อัปเดตสถานะงานแล้ว');
    }

    public function comment(Request $request, Ticket $ticket)
    {
        Gate::authorize('view', $ticket);
        $data = $request->validate(['message' => 'required|string|min:2|max:1500']);
        $ticket->events()->create(['actor_id' => $request->user()->id, 'action' => 'comment', 'message' => $data['message']]);

        return back()->with('success', 'เพิ่มข้อความในประวัติแล้ว');
    }

    public function photo(Ticket $ticket, TicketPhoto $photo)
    {
        Gate::authorize('view', $ticket);
        abort_unless($photo->ticket_id === $ticket->id, 404);
        abort_unless(Storage::disk('local')->exists($photo->path), 404);

        return Storage::disk('local')->response($photo->path, null, ['Content-Type' => $photo->mime, 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
