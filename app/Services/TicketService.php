<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class TicketService
{
    public function notify(Ticket $ticket, User $actor, string $message): void
    {
        $ids = User::where('role', 'manager')->pluck('id')->push($ticket->resident_id, $ticket->assignee_id)->filter()->unique();
        User::whereIn('id', $ids)->where('id', '!=', $actor->id)->get()->each(fn ($user) => $user->notify(new TicketUpdated($ticket->id, $message)));
    }

    public function assign(Ticket $ticket, User $actor, int $assigneeId): void
    {
        DB::transaction(function () use ($ticket, $actor, $assigneeId) {
            $locked = Ticket::lockForUpdate()->findOrFail($ticket->id);
            if (! in_array($locked->status, ['new', 'reopened', 'assigned'])) {
                throw ValidationException::withMessages(['assignee_id' => 'มอบหมายได้เฉพาะงานใหม่ งานเปิดใหม่ หรืองานที่ยังไม่เริ่ม']);
            }
            $assignee = User::where('role', 'technician')->findOrFail($assigneeId);
            if ($locked->status === 'assigned' && $locked->assignee_id === $assignee->id) {
                return;
            }
            $hadAppointment = $locked->appointment_status !== null;
            $locked->update(['assignee_id' => $assignee->id, 'status' => 'assigned', 'appointment_start' => null, 'appointment_end' => null, 'appointment_status' => null, 'appointment_note' => null, 'appointment_response_note' => null, 'appointment_version' => $locked->appointment_version + 1]);
            $message = "มอบหมายงานให้ {$assignee->name}";
            if ($hadAppointment) {
                $message .= ' และยกเลิกนัดเดิม ต้องเสนอนัดใหม่';
            }
            $locked->events()->create(['actor_id' => $actor->id, 'action' => 'assign', 'message' => $message]);
            $this->notify($locked, $actor, $message);
        });
    }

    public function transition(Ticket $ticket, User $actor, string $action, ?string $note): void
    {
        DB::transaction(function () use ($ticket, $actor, $action, $note) {
            $locked = Ticket::lockForUpdate()->findOrFail($ticket->id);
            // Recheck ownership under the lock: a manager may have reassigned this job.
            $policy = in_array($action, ['start', 'finish']) ? 'work' : 'confirm';
            Gate::forUser($actor)->authorize($policy, $locked);
            [$expected, $next, $label] = match ($action) {
                'start' => ['assigned', 'in_progress', 'ช่างเริ่มดำเนินการ'],
                'finish' => ['in_progress', 'awaiting_confirmation', 'ซ่อมเสร็จ รอผู้พักยืนยัน'],
                'confirm' => ['awaiting_confirmation', 'closed', 'ผู้พักยืนยันและปิดงาน'],
                'reopen' => ['awaiting_confirmation', 'reopened', 'ผู้พักแจ้งว่ายังมีปัญหา เปิดงานใหม่'],
                default => throw ValidationException::withMessages(['action' => 'คำสั่งไม่ถูกต้อง']),
            };
            if ($locked->status !== $expected) {
                throw ValidationException::withMessages(['action' => 'สถานะงานเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่']);
            }
            if ($action === 'start' && $locked->appointment_status !== null && $locked->appointment_status !== 'confirmed') {
                throw ValidationException::withMessages(['action' => 'มีการเสนอนัดแล้ว ต้องให้คนพักยืนยันนัดก่อนเริ่มงาน']);
            }
            $changes = ['status' => $next];
            if ($action === 'finish') {
                $changes['completion_note'] = $note;
            }
            if ($action === 'confirm') {
                $changes['closed_at'] = now();
            }
            $locked->update($changes);
            $locked->events()->create(['actor_id' => $actor->id, 'action' => $action, 'message' => $label.($note ? ': '.$note : '')]);
            $this->notify($locked, $actor, $label);
        });
    }
}
