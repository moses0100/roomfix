<?php

return [
    'required' => 'กรุณากรอก :attribute',
    'required_if' => 'กรุณากรอก :attribute สำหรับขั้นตอนนี้',
    'email' => 'รูปแบบอีเมลไม่ถูกต้อง',
    'unique' => ':attribute นี้มีอยู่ในระบบแล้ว',
    'exists' => ':attribute ไม่ถูกต้อง',
    'in' => ':attribute ไม่อยู่ในตัวเลือกที่รองรับ',
    'current_password' => 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
    'confirmed' => 'รหัสผ่านใหม่และรหัสยืนยันไม่ตรงกัน',
    'mimes' => 'รูปภาพรองรับเฉพาะ JPG, PNG และ WebP',
    'image' => 'ไฟล์แนบต้องเป็นรูปภาพที่รองรับ',
    'dimensions' => 'รูปภาพต้องไม่เกิน 3000 × 3000 พิกเซล',
    'min' => ['string' => ':attribute ต้องมีอย่างน้อย :min ตัวอักษร'],
    'max' => ['string' => ':attribute ต้องไม่เกิน :max ตัวอักษร', 'file' => 'รูปภาพต้องไม่เกิน :max KB', 'array' => 'แนบรูปได้สูงสุด :max รูป'],
    'attributes' => ['title' => 'หัวข้อปัญหา', 'description' => 'รายละเอียด', 'note' => 'รายละเอียดการดำเนินการ', 'assignee_id' => 'ช่าง', 'name' => 'ชื่อ', 'email' => 'อีเมล', 'password' => 'รหัสผ่าน', 'room' => 'เลขห้อง', 'message' => 'ข้อความ'],
];
