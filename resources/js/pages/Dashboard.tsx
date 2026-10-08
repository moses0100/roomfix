import { Link, usePage } from "@inertiajs/react";
import {
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Sparkles,
    Wrench,
} from "lucide-react";
import Layout, { NewTicketButton, PageHeading } from "../components/Layout";
import TicketTable, { categoryIcons } from "../components/TicketTable";
import {
    categories,
    appointmentDate,
    appointmentStatuses,
    type Shared,
    type Ticket,
} from "../types";
export default function Dashboard({
    counts,
    recent,
    categories: distribution,
    overdue,
    upcoming,
}: {
    counts: Record<string, number>;
    recent: Ticket[];
    categories: { category: string; total: number }[];
    overdue: number;
    upcoming: Ticket[];
}) {
    const user = usePage<Shared>().props.auth.user!;
    const count = (...s: string[]) =>
        s.reduce((n, key) => n + Number(counts[key] ?? 0), 0);
    const cards = [
        {
            label: "รอมอบหมาย",
            value: count("new", "reopened"),
            Icon: ClipboardList,
            color: "sand",
            caption: "งานที่รอผู้ดูแลจัดการ",
        },
        {
            label: "กำลังดำเนินการ",
            value: count("assigned", "in_progress"),
            Icon: Wrench,
            color: "green",
            caption: "มอบหมายแล้วและกำลังซ่อม",
        },
        {
            label: "รอคนพักยืนยัน",
            value: count("awaiting_confirmation"),
            Icon: Clock3,
            color: "blue",
            caption: "ช่างส่งงานเรียบร้อยแล้ว",
        },
        {
            label: "ปิดงานแล้ว",
            value: count("closed"),
            Icon: CheckCircle2,
            color: "gray",
            caption: "ผู้พักยืนยันผลการซ่อม",
        },
    ];
    return (
        <Layout title="ภาพรวม">
            <PageHeading
                title={`สวัสดี ${user.name} 👋`}
                subtitle={
                    user.role === "manager"
                        ? "มาดูแลให้งานซ่อมทุกงานเดินหน้ากันวันนี้"
                        : user.role === "technician"
                          ? "งานที่ได้รับมอบหมายและความคืบหน้าของคุณ"
                          : "ติดตามงานซ่อมของห้องคุณ ทุกขั้นตอนอยู่ที่นี่"
                }
            >
                {user.role === "resident" ? (
                    <NewTicketButton />
                ) : (
                    <Link className="button primary" href="/tickets">
                        ดูรายการงาน <ArrowRight size={17} />
                    </Link>
                )}
            </PageHeading>
            <div className="stats-grid">
                {cards.map(({ label, value, Icon, color, caption }) => (
                    <article key={label} className="stat-card">
                        <div>
                            <span>{label}</span>
                            <span className={`stat-icon ${color}`}>
                                <Icon size={19} />
                            </span>
                        </div>
                        <strong>
                            {value}
                            <small> งาน</small>
                        </strong>
                        <p>{caption}</p>
                    </article>
                ))}
            </div>
            <div className="dashboard-middle">
                <div className="welcome-card">
                    <div>
                        <span className="mini-label">
                            <Sparkles size={14} />
                            ทุกงานมีขั้นตอนที่ชัดเจน
                        </span>
                        <h2>
                            ดูแลห้องพักให้ดีขึ้น
                            <br />
                            ด้วยงานซ่อมที่ติดตามได้
                        </h2>
                        <p>แจ้งปัญหา → มอบหมายช่าง → ซ่อม → ผู้พักยืนยัน</p>
                        <Link href="/tickets">
                            ติดตามงานของคุณ <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="home-illustration">
                        <div className="roof" />
                        <div className="house">
                            <i />
                            <i />
                            <i />
                            <i />
                            <span>
                                <Wrench size={24} />
                            </span>
                        </div>
                        <div className="illustration-check">
                            <CheckCircle2 size={22} />
                        </div>
                    </div>
                </div>
                <div className="attention-card">
                    <Clock3 size={21} />
                    <h3>งานที่ยังเปิดเกิน 3 วัน</h3>
                    <strong>
                        {overdue}
                        <small> งาน</small>
                    </strong>
                    <p>
                        ช่วยตรวจและติดตามงานเหล่านี้
                        <br />
                        เพื่อไม่ให้ผู้พักรอนาน
                    </p>
                    <Link href="/tickets?overdue=1">
                        ตรวจงานค้างเกิน 3 วัน →
                    </Link>
                </div>
            </div>
            <section className="panel upcoming-panel">
                <div className="section-heading">
                    <div>
                        <h2>นัดเข้าซ่อมที่กำลังจะถึง</h2>
                        <p>นัดของงานที่คุณมีสิทธิ์ดู · เวลาประเทศไทย</p>
                    </div>
                    <Link href="/tickets?overdue=1">งานค้างเกิน 3 วัน →</Link>
                </div>
                {upcoming.length ? (
                    <div className="upcoming-list">
                        {upcoming.map((t) => (
                            <Link key={t.id} href={`/tickets/${t.id}`}>
                                <div>
                                    <strong>{t.title}</strong>
                                    <small>
                                        ห้อง {t.room} · {t.assignee?.name}
                                    </small>
                                </div>
                                <div>
                                    <strong>
                                        {appointmentDate(t.appointment_start!)}
                                    </strong>
                                    <small>
                                        {
                                            appointmentStatuses[
                                                t.appointment_status!
                                            ]
                                        }
                                    </small>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="upcoming-empty">
                        ยังไม่มีนัดที่จะถึง
                        ผู้ดูแลสามารถเสนอเวลาได้ในงานที่มอบหมายแล้ว
                    </p>
                )}
            </section>
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>งานล่าสุด</h2>
                        <p>
                            {user.role === "manager"
                                ? "รายการแจ้งซ่อมล่าสุดของอาคาร"
                                : "รายการล่าสุดที่คุณมีสิทธิ์ดู"}
                        </p>
                    </div>
                    <Link href="/tickets">
                        ดูทั้งหมด <ArrowRight size={15} />
                    </Link>
                </div>
                <TicketTable tickets={recent} />
            </section>
            <section className="category-summary">
                <div>
                    <h2>ภาพรวมประเภทงาน</h2>
                    <p>นับจากงานทั้งหมดที่คุณมีสิทธิ์ดู</p>
                </div>
                <div>
                    {Object.entries(categories).map(([key, label]) => {
                        const Icon = categoryIcons[key];
                        return (
                            <article key={key}>
                                <Icon size={18} />
                                <span>{label}</span>
                                <strong>
                                    {distribution.find(
                                        (c) => c.category === key,
                                    )?.total ?? 0}
                                </strong>
                            </article>
                        );
                    })}
                </div>
            </section>
        </Layout>
    );
}
