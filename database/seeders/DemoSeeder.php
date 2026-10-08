<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\User;
use App\Services\DemoSandbox;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (config('roomfix.isolated_demo')) {
            app(DemoSandbox::class)->assertIsolated();
        } elseif (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Demo accounts are forbidden outside local/testing');
        }
        $make = fn ($email, $name, $role, $room = null) => User::firstOrCreate(['email' => $email], ['name' => $name, 'role' => $role, 'room' => $room, 'password' => 'RoomFixDemo!2026']);
        $manager = $make('manager@roomfix.test', 'พิมพ์ชนก', 'manager');
        $tech = $make('tech@roomfix.test', 'ช่างต้น', 'technician');
        $resident = $make('resident@roomfix.test', 'มินตรา', 'resident', 'A-203');
        $other = $make('resident2@roomfix.test', 'ณัฐ', 'resident', 'B-401');
        if (Ticket::count()) {
            return;
        }
        foreach ([
            ['ก๊อกน้ำอ่างล้างหน้ารั่ว', 'น้ำหยดตลอดทั้งวัน ปิดก๊อกแน่นแล้วยังไม่หยุด กรุณาช่วยตรวจให้หน่อยค่ะ', 'plumbing', 'high', 'new', $resident],
            ['แอร์ไม่เย็นและมีเสียงดัง', 'เปิดแอร์มาประมาณหนึ่งชั่วโมงยังไม่เย็น มีเสียงจากเครื่องด้านใน', 'aircon', 'normal', 'assigned', $other],
            ['ไฟห้องน้ำกระพริบ', 'ไฟห้องน้ำกระพริบเป็นช่วง ๆ เริ่มเป็นเมื่อวานตอนเย็น', 'electrical', 'high', 'in_progress', $resident],
            ['ประตูระเบียงปิดไม่สนิท', 'บานประตูเลื่อนฝืดและปิดไม่สนิท อยากให้ช่วยตรวจรางประตู', 'structure', 'normal', 'awaiting_confirmation', $resident],
            ['ท่อน้ำทิ้งอุดตัน', 'น้ำระบายช้าในอ่างล้างจาน ล้างแล้วน้ำยังขังอยู่', 'plumbing', 'normal', 'closed', $other],
            ['ปลั๊กไฟข้างโต๊ะใช้งานไม่ได้', 'เสียบโคมไฟแล้วไม่ติด ลองโคมไฟกับปลั๊กอื่นใช้งานได้', 'electrical', 'normal', 'new', $other],
        ] as $i => [$title, $description, $category, $urgency, $status, $owner]) {
            $ticket = Ticket::create(['title' => $title, 'description' => $description, 'category' => $category, 'urgency' => $urgency, 'status' => $status, 'resident_id' => $owner->id, 'room' => $owner->room, 'assignee_id' => in_array($status, ['assigned', 'in_progress', 'awaiting_confirmation', 'closed']) ? $tech->id : null, 'created_at' => now()->subHours($i * 18 + 2), 'closed_at' => $status === 'closed' ? now()->subHour() : null, 'completion_note' => in_array($status, ['awaiting_confirmation', 'closed']) ? 'ตรวจและแก้ไขเรียบร้อย ทดสอบการใช้งานแล้ว' : null]);
            $ticket->events()->create(['actor_id' => $owner->id, 'action' => 'create', 'message' => 'ตัวอย่าง: ผู้พักแจ้งปัญหา']);
            if ($ticket->assignee_id) {
                $ticket->events()->create(['actor_id' => $manager->id, 'action' => 'assign', 'message' => 'ตัวอย่าง: มอบหมายให้ช่างต้น']);
            }
        }
    }
}
