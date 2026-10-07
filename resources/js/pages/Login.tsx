import { Head, useForm, usePage } from "@inertiajs/react";
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardCheck,
    LockKeyhole,
    Wrench,
} from "lucide-react";
import { type Shared } from "../types";
import { Errors } from "../components/Layout";
export default function Login() {
    const { building, demo } = usePage<Shared>().props;
    const form = useForm({ email: "", password: "" });
    return (
        <>
            <Head title="เข้าสู่ระบบ" />
            <div className="login-page">
                <section className="login-story">
                    <div className="brand">
                        <span>
                            <Wrench size={24} />
                        </span>
                        Room<strong>Fix</strong>
                    </div>
                    <div className="login-copy">
                        <div className="eyebrow">MAINTENANCE, MADE HUMAN.</div>
                        <h1>
                            งานซ่อมไม่ควร
                            <br />
                            หายไปในแชท<span>.</span>
                        </h1>
                        <p>
                            ตั้งแต่แจ้งปัญหาจนถึงยืนยันงานเสร็จ
                            <br />
                            ทุกคนเห็นความคืบหน้าในที่เดียว
                        </p>
                        <div className="login-flow">
                            <span>
                                <Building2 />
                                แจ้งปัญหา
                            </span>
                            <i>→</i>
                            <span>
                                <Wrench />
                                ช่างลงมือ
                            </span>
                            <i>→</i>
                            <span>
                                <ClipboardCheck />
                                ยืนยันงาน
                            </span>
                        </div>
                        <div className="story-note">
                            <CheckCircle2 size={20} />
                            <div>
                                มีคนรับผิดชอบ มีประวัติ ทุกงานติดตามได้
                                <small>
                                    รูปแนบส่วนตัว · สิทธิ์ตามบทบาท ·
                                    แจ้งเตือนในระบบ
                                </small>
                            </div>
                        </div>
                    </div>
                    <small className="story-footer">
                        ออกแบบเพื่ออาคารที่ใส่ใจคนพัก
                    </small>
                </section>
                <section className="login-form">
                    <div className="login-form-inner">
                        <div className="login-icon">
                            <LockKeyhole size={24} />
                        </div>
                        <h2>ยินดีต้อนรับกลับ</h2>
                        <p>{building}</p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post("/login", {
                                    onFinish: () => form.reset("password"),
                                });
                            }}
                        >
                            <label>
                                อีเมล
                                <input
                                    type="email"
                                    autoComplete="username"
                                    required
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData("email", e.target.value)
                                    }
                                    placeholder="your@email.com"
                                />
                            </label>
                            <label>
                                รหัสผ่าน
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData("password", e.target.value)
                                    }
                                    placeholder="กรอกรหัสผ่าน"
                                />
                            </label>
                            <Errors errors={form.errors} />
                            <button
                                className="primary wide"
                                disabled={form.processing}
                            >
                                เข้าสู่ระบบ <ArrowRight size={17} />
                            </button>
                        </form>
                        {demo && (
                            <div className="demo-box">
                                <strong>ลองใช้ด้วยบัญชีตัวอย่าง</strong>
                                <p>
                                    เลือกบทบาท แล้วกดเข้าสู่ระบบเพื่อทดลอง
                                    workflow
                                </p>
                                <div>
                                    {[
                                        ["manager", "ผู้ดูแล"],
                                        ["resident", "คนพัก"],
                                        ["tech", "ช่าง"],
                                    ].map(([role, label]) => (
                                        <button
                                            key={role}
                                            onClick={() => {
                                                form.setData({
                                                    email: `${role}@roomfix.test`,
                                                    password:
                                                        "RoomFixDemo!2026",
                                                });
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <small>
                                    ข้อมูลสมมติสำหรับ demo ในเครื่องเท่านั้น
                                </small>
                            </div>
                        )}
                        <p className="login-help">
                            ต้องการบัญชีหรือจำรหัสไม่ได้? ติดต่อผู้ดูแลอาคาร
                            <br />
                            ระบบนี้ไม่มีการสมัครเข้าห้องพักด้วยตนเอง
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}
