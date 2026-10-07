<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;

Artisan::command('roomfix:manager {email} {--name=ผู้ดูแลอาคาร}', function () {
    $email = $this->argument('email');
    $name = $this->option('name');
    $password = $this->secret('รหัสผ่านใหม่ (อย่างน้อย 12 ตัวอักษร)');
    $confirmation = $this->secret('ยืนยันรหัสผ่าน');
    $validator = Validator::make(['email' => $email, 'name' => $name, 'password' => $password, 'password_confirmation' => $confirmation], [
        'email' => 'required|email|max:254|unique:users',
        'name' => 'required|string|max:80',
        'password' => 'required|string|min:12|max:200|confirmed',
    ]);
    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) $this->error($error);
        return 1;
    }
    User::create(['email' => $email, 'name' => $name, 'password' => $password, 'role' => 'manager']);
    $this->info('สร้างบัญชีผู้ดูแลแล้ว');
    return 0;
})->purpose('Create an initial manager with a hidden password prompt');
