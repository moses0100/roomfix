import { useForm, usePage } from "@inertiajs/react";
import { type Shared } from "../types";
import Layout, { Errors, PageHeading } from "../components/Layout";
export default function Settings() {
    const { isolated_demo } = usePage<Shared>().props;
    const form = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    if (isolated_demo)
        return (
            <Layout title="ตั้งค่าบัญชี">
                <PageHeading
                    title="บัญชีทดลองใช้ร่วมกัน"
                    subtitle="โหมดเดโมล็อกการเปลี่ยนรหัสผ่าน เพื่อให้ผู้ทดลองคนถัดไปยังเข้าสู่ระบบได้"
                />
                <section className="panel form-panel">
                    <p>
                        คุณยังทดลองแจ้งซ่อม นัดช่าง
                        และติดตามงานได้ตามบทบาทที่เลือก
                    </p>
                </section>
            </Layout>
        );
    return (
        <Layout title="ตั้งค่าบัญชี">
            <PageHeading
                title="ดูแลบัญชีของคุณ"
                subtitle="เปลี่ยนรหัสผ่านเริ่มต้นเป็นรหัสที่คุณเลือกเอง"
            />
            <form
                className="panel form-panel settings-panel"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post("/settings/password", {
                        onFinish: () => form.reset(),
                    });
                }}
            >
                <h2>เปลี่ยนรหัสผ่าน</h2>
                <label>
                    รหัสผ่านปัจจุบัน
                    <input
                        required
                        type="password"
                        autoComplete="current-password"
                        value={form.data.current_password}
                        onChange={(e) =>
                            form.setData("current_password", e.target.value)
                        }
                    />
                </label>
                <label>
                    รหัสผ่านใหม่
                    <input
                        required
                        minLength={12}
                        maxLength={200}
                        type="password"
                        autoComplete="new-password"
                        value={form.data.password}
                        onChange={(e) =>
                            form.setData("password", e.target.value)
                        }
                    />
                </label>
                <label>
                    ยืนยันรหัสผ่านใหม่
                    <input
                        required
                        type="password"
                        autoComplete="new-password"
                        value={form.data.password_confirmation}
                        onChange={(e) =>
                            form.setData(
                                "password_confirmation",
                                e.target.value,
                            )
                        }
                    />
                </label>
                <Errors errors={form.errors} />
                <button className="primary" disabled={form.processing}>
                    บันทึกรหัสผ่านใหม่
                </button>
            </form>
        </Layout>
    );
}
