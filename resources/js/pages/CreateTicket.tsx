import { Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, ImagePlus, LockKeyhole, Send } from "lucide-react";
import Layout, { Errors, PageHeading } from "../components/Layout";
import { categories, urgencies, type Shared } from "../types";
export default function CreateTicket() {
    const user = usePage<Shared>().props.auth.user!;
    const form = useForm({
        title: "",
        description: "",
        category: "plumbing",
        urgency: "normal",
        photos: [] as File[],
    });
    return (
        <Layout title="แจ้งซ่อมใหม่">
            <PageHeading
                title="มีอะไรให้เราช่วยดูแล?"
                subtitle={`แจ้งปัญหาของห้อง ${user.room} แล้วผู้ดูแลจะมอบหมายช่างให้คุณ`}
            />
            <Link href="/tickets" className="back-link">
                <ArrowLeft size={16} />
                กลับไปรายการ
            </Link>
            <div className="form-columns">
                <form
                    className="panel form-panel"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post("/tickets", { forceFormData: true });
                    }}
                >
                    <h2>รายละเอียดปัญหา</h2>
                    <label>
                        หัวข้อปัญหา
                        <input
                            required
                            minLength={5}
                            maxLength={120}
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData("title", e.target.value)
                            }
                            placeholder="เช่น ก๊อกน้ำอ่างล้างหน้ารั่ว"
                        />
                    </label>
                    <div className="two-fields">
                        <label>
                            ประเภทงาน
                            <select
                                value={form.data.category}
                                onChange={(e) =>
                                    form.setData("category", e.target.value)
                                }
                            >
                                {Object.entries(categories).map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            ความเร่งด่วน
                            <select
                                value={form.data.urgency}
                                onChange={(e) =>
                                    form.setData("urgency", e.target.value)
                                }
                            >
                                {Object.entries(urgencies).map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {form.data.urgency === "urgent" && (
                        <div className="warning">
                            กรณีฉุกเฉินให้ติดต่อผู้ดูแลทันที
                            ระบบนี้ไม่ได้เฝ้ารับแจ้งตลอด 24 ชั่วโมง
                        </div>
                    )}
                    <label>
                        รายละเอียด
                        <textarea
                            required
                            minLength={10}
                            maxLength={3000}
                            rows={6}
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData("description", e.target.value)
                            }
                            placeholder="เกิดตรงไหน เริ่มเมื่อไร และลองแก้เบื้องต้นอย่างไรแล้วบ้าง"
                        />
                    </label>
                    <label className="upload-zone">
                        <ImagePlus size={24} />
                        <strong>แนบรูปให้เห็นปัญหาชัดขึ้น</strong>
                        <small>
                            JPG / PNG / WebP สูงสุด 2 รูป · รูปละ 3 MB · ไม่เกิน
                            3000 × 3000 px
                        </small>
                        <input
                            type="file"
                            aria-label="แนบรูปปัญหา"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) =>
                                form.setData(
                                    "photos",
                                    Array.from(e.target.files ?? []),
                                )
                            }
                        />
                        {form.data.photos.map((f) => (
                            <span key={f.name}>{f.name}</span>
                        ))}
                    </label>
                    <Errors errors={form.errors} />
                    {form.progress && (
                        <p role="status">
                            กำลังส่งรูป {form.progress.percentage}%
                        </p>
                    )}
                    <button className="primary" disabled={form.processing}>
                        <Send size={16} />
                        ส่งคำขอแจ้งซ่อม
                    </button>
                </form>
                <aside className="form-tip">
                    <span className="tip-icon">
                        <LockKeyhole size={23} />
                    </span>
                    <h3>
                        ดูแลงานของคุณ
                        <br />
                        และข้อมูลของคุณ
                    </h3>
                    <p>
                        รูปและรายละเอียดดูได้เฉพาะคุณ ผู้ดูแล
                        และช่างที่ได้รับมอบหมาย
                    </p>
                    <hr />
                    <strong>หลังส่งคำขอ</strong>
                    <ol>
                        <li>ผู้ดูแลตรวจและมอบหมายงาน</li>
                        <li>ช่างอัปเดตความคืบหน้า</li>
                        <li>คุณตรวจและยืนยันผลการซ่อม</li>
                    </ol>
                    <small>ดูการอัปเดตได้ที่เมนูการแจ้งเตือน</small>
                </aside>
            </div>
        </Layout>
    );
}
