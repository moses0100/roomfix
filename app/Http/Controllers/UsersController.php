<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'manager', 403);

        return Inertia::render('Users', ['users' => User::orderBy('role')->orderBy('name')->get(['id', 'name', 'email', 'role', 'room'])]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'manager', 403);
        abort_if(config('roomfix.isolated_demo'), 403, 'โหมดเดโมใช้บัญชีตัวอย่างที่เตรียมไว้เท่านั้น');
        $data = $request->validate(['name' => 'required|string|max:80', 'email' => 'required|email|max:254|unique:users', 'role' => 'required|in:resident,technician', 'room' => 'nullable|required_if:role,resident|string|max:20', 'password' => 'required|string|min:12|max:200']);
        if ($data['role'] !== 'resident') {
            $data['room'] = null;
        }
        User::create($data);

        return back()->with('success', 'สร้างบัญชีแล้ว แจ้งรหัสผ่านให้เจ้าของบัญชีผ่านช่องทางส่วนตัว');
    }
}
