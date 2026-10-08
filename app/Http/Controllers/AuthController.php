<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function loginPage()
    {
        return Inertia::render('Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email|max:254', 'password' => 'required|string|max:200']);
        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages(['email' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง']);
        }
        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    public function password(Request $request)
    {
        abort_if(config('roomfix.isolated_demo'), 403, 'บัญชีเดโมใช้ร่วมกัน จึงเปลี่ยนรหัสผ่านไม่ได้');
        $data = $request->validate(['current_password' => 'required|current_password', 'password' => 'required|string|min:12|max:200|confirmed']);
        $request->user()->update(['password' => $data['password']]);
        $request->session()->regenerate();

        return back()->with('success', 'เปลี่ยนรหัสผ่านแล้ว');
    }
}
