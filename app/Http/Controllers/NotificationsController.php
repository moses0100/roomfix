<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Inertia\Inertia;
class NotificationsController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Notifications', ['notifications' => $request->user()->notifications()->latest()->limit(50)->get()]);
    }
    public function read(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);
        return back()->with('success', 'ทำเครื่องหมายว่าอ่านแล้ว');
    }
}
