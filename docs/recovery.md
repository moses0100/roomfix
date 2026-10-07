# Recoverable checkpoints

## โค้ด

Commit ให้เรียบร้อยก่อนสร้าง snapshot แล้วใช้ชื่อใหม่ทุกครั้ง

```sh
node scripts/checkpoint.mjs --label release-v1
node scripts/rollback.mjs --label release-v1
```

ไฟล์อยู่ `backups/code/` (ไม่เข้า Git) manifest ระบุ commit และ SHA-256 ของ ZIP ตัว restore ตรวจ checksum และ path ก่อนแตกไปโฟลเดอร์ใหม่ใน `rollback-recovery/` ไม่มี .env, vendor, node_modules หรือฐานข้อมูลติดไปด้วย ติดตั้ง dependency และสร้าง .env ใหม่ในสำเนากู้คืน

ใช้ `--ref checkpoint/roomfix-core` เพื่อสำรอง checkpoint เก่าจาก Git ได้ Tags ที่ทำเสร็จแล้ว: core, verified, release, github-published

## ฐานข้อมูลและรูป

```sh
node scripts/backup-data.mjs before-change
node scripts/restore-data.mjs before-change
```

ต้องมี Docker compose app/database กำลังทำงาน ขณะ backup เว็บจะเข้า maintenance mode ชั่วคราว และปลดออกใน finally เมื่อจบ `pg_dump --format=custom` กับไฟล์ private photos ถูกเก็บคู่กันพร้อม SHA-256 รองรับฐานข้อมูลปัจจุบันโดยส่งชื่อเป็น argument ที่สอง เช่น `node scripts/backup-data.mjs another-snapshot roomfix_restore_123`

snapshot อยู่ `backups/data/<label>/` มีข้อมูลบัญชีและงานพักอาศัยจริง ต้องเก็บส่วนตัว ห้าม commit หรืออัปโหลดเป็น portfolio script จำกัด dump ในหน่วยความจำไม่เกิน 128 MB จึงเหมาะกับรุ่นแรก/ข้อมูลไม่มาก

restore ตรวจ checksum ทั้งฐานข้อมูลและรูปก่อนสร้างฐานข้อมูลชื่อ `roomfix_restore_<timestamp>` แล้วคืนข้อมูลลงฐานใหม่นั้น ใช้ `pg_restore --exit-on-error` ไม่ drop/clean ฐานหลัก รูปอยู่ในโฟลเดอร์กู้คืนใหม่ `rollback-recovery/<label>-<timestamp>/private/` และ restore.json บอกจำนวน users/tickets/photos/events ที่ตรวจพบ ถ้าขั้นตอนล้มเหลว ฐานกู้คืนอาจค้างอยู่แต่ฐานหลักไม่เปลี่ยน

## เมื่อต้องสลับมาใช้สำเนากู้คืน

1. ตรวจ source checkpoint, restore.json และทดลองอ่านข้อมูลในฐานกู้คืนก่อน
2. สำรองระบบปัจจุบันเป็นชื่อใหม่ก่อนเสมอ
3. ทดสอบสำเนาแอปใน directory ใหม่ โดยให้ DB_DATABASE ชี้ฐานที่ restore ไว้ และ copy private photos ไป storage/app/private ของสำเนานั้น
4. Compose มีชื่อ project `roomfix` คงที่ ถ้าทดลองสำเนาพร้อมระบบเดิม ต้องเปลี่ยน compose project name และพอร์ตเพื่อไม่ recreate container เดิม เชื่อม network ฐานข้อมูลเดิมอย่างเจาะจง หรือ restore ลง database ของ compose ชุดใหม่
5. สลับระบบจริงเฉพาะเมื่อยืนยันข้อมูลถูกต้องแล้ว ขั้นตอนนี้เป็นการตัดสินใจของผู้ดูแล ไม่ได้เกิดอัตโนมัติจาก restore script

อย่าลบ Docker volumes ระหว่างกู้คืน อย่าใช้ `docker compose down -v` กับข้อมูลใช้งาน
