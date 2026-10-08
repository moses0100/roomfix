<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function update(Ticket $ticket, User $actor, array $data): void
    {
        DB::transaction(function () use ($ticket, $actor, $data) {
            $locked = Ticket::lockForUpdate()->findOrFail($ticket->id);
            $action = $data['action'];
            Gate::forUser($actor)->authorize(in_array($action, ['propose', 'cancel']) ? 'assign' : 'confirm', $locked);
            if ($locked->status !== 'assigned' || ! $locked->assignee_id) {
                $this->reject('นัดหมายได้เฉพาะงานที่มอบหมายช่างแล้วและยังไม่เริ่มซ่อม');
            }
            if ((int) $data['version'] !== $locked->appointment_version) {
                $this->reject('นัดหมายเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่ก่อนตอบรับ');
            }

            $changes = ['appointment_version' => $locked->appointment_version + 1];
            if ($action === 'propose') {
                $start = CarbonImmutable::parse($data['start'])->utc();
                $end = CarbonImmutable::parse($data['end'])->utc();
                if ($start->isPast() || $end->lessThanOrEqualTo($start) || $start->diffInMinutes($end) > 240) {
                    $this->reject('เลือกเวลาในอนาคตและช่วงนัดไม่เกิน 4 ชั่วโมง');
                }
                // Serialize bookings for one technician even when requests concern
                // different tickets. Adjacent slots are allowed; overlapping ones aren't.
                User::where('role', 'technician')->lockForUpdate()->findOrFail($locked->assignee_id);
                $overlap = Ticket::where('assignee_id', $locked->assignee_id)->where('id', '!=', $locked->id)
                    ->whereIn('status', ['assigned', 'in_progress'])->whereIn('appointment_status', ['pending', 'confirmed'])
                    ->where('appointment_start', '<', $end)->where('appointment_end', '>', $start)->exists();
                if ($overlap) {
                    $this->reject('ช่างมีนัดอื่นซ้อนในช่วงเวลานี้ กรุณาเลือกเวลาใหม่');
                }
                $changes += ['appointment_start' => $start, 'appointment_end' => $end, 'appointment_status' => 'pending', 'appointment_note' => $data['note'] ?? null, 'appointment_response_note' => null];
                $message = 'ผู้ดูแลเสนอนัดเข้าซ่อม '.$start->setTimezone('Asia/Bangkok')->format('d/m/Y H:i').'–'.$end->setTimezone('Asia/Bangkok')->format('d/m/Y H:i').' (เวลาไทย)';
            } elseif ($action === 'cancel') {
                if (! in_array($locked->appointment_status, ['pending', 'confirmed', 'declined'])) {
                    $this->reject('ไม่มีนัดที่ยกเลิกได้');
                }
                $changes['appointment_status'] = 'cancelled';
                $message = 'ผู้ดูแลยกเลิกนัดเข้าซ่อม';
            } else {
                if ($locked->appointment_status !== 'pending' || $locked->appointment_end->isPast()) {
                    $this->reject('นัดนี้ตอบรับไปแล้วหรือหมดเวลา กรุณารอผู้ดูแลเสนอนัดใหม่');
                }
                $changes['appointment_status'] = $action === 'confirm' ? 'confirmed' : 'declined';
                $changes['appointment_response_note'] = $action === 'decline' ? $data['note'] : null;
                $message = $action === 'confirm' ? 'คนพักยืนยันนัดเข้าซ่อม' : 'คนพักไม่สะดวกตามนัด: '.$data['note'];
            }
            $locked->update($changes);
            $locked->events()->create(['actor_id' => $actor->id, 'action' => 'appointment_'.$action, 'message' => $message.($action === 'propose' && ! empty($data['note']) ? ': '.$data['note'] : '')]);
            app(TicketService::class)->notify($locked, $actor, $message);
        });
    }

    private function reject(string $message): never
    {
        throw ValidationException::withMessages(['appointment' => $message]);
    }
}
