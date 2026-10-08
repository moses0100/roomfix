import { Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    MessageSquare,
    UserRound,
    Wrench,
} from "lucide-react";
import Layout, { Errors, PageHeading } from "../components/Layout";
import { Status } from "../components/TicketTable";
import AppointmentPanel from "../components/AppointmentPanel";
import {
    categories,
    date,
    urgencies,
    type Ticket,
    type User,
    type Shared,
} from "../types";
export default function TicketDetail({
    ticket,
    technicians,
}: {
    ticket: Ticket;
    technicians: User[];
}) {
    const user = usePage<Shared>().props.auth.user!;
    const assign = useForm({
        assignee_id: ticket.assignee_id ? String(ticket.assignee_id) : "",
    });
    const transition = useForm({ action: "", note: "" });
    const comment = useForm({ message: "" });
    const act = (action: string) => {
        transition.transform((data) => ({ ...data, action }));
        transition.post(`/tickets/${ticket.id}/transition`, {
            onSuccess: () => transition.reset(),
        });
    };
    return (
        <Layout title="รายละเอียดงาน">
            <PageHeading
                title={ticket.title}
                subtitle={`RF-${String(ticket.id).padStart(4, "0")} · ห้อง ${ticket.room} · แจ้งเมื่อ ${date(ticket.created_at)}`}
            >
                <Status value={ticket.status} />
            </PageHeading>
            <Link href="/tickets" className="back-link">
                <ArrowLeft size={16} />
                กลับไปรายการ
            </Link>
            <div className="detail-grid">
                <div>
                    <section className="panel detail-panel">
                        <div className="section-heading">
                            <h2>รายละเอียดปัญหา</h2>
                            <span className="category-tag">
                                {categories[ticket.category]}
                            </span>
                        </div>
                        <p className="preserve-space">{ticket.description}</p>
                        <div className="detail-meta">
                            <span>
                                <UserRound size={16} />
                                ผู้แจ้ง: {ticket.resident.name}
                            </span>
                            <span>
                                <Clock3 size={16} />
                                {urgencies[ticket.urgency]}
                            </span>
                        </div>
                        {!!ticket.photos?.length && (
                            <div className="photos">
                                {ticket.photos.map((p) => (
                                    <a
                                        href={`/tickets/${ticket.id}/photos/${p.id}`}
                                        key={p.id}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img
                                            src={`/tickets/${ticket.id}/photos/${p.id}`}
                                            alt={`รูปปัญหาที่แนบ ${p.id}`}
                                            loading="lazy"
                                        />
                                    </a>
                                ))}
                            </div>
                        )}
                        {ticket.completion_note && (
                            <div className="completion">
                                <CheckCircle2 size={18} />
                                <div>
                                    <strong>รายละเอียดการซ่อมจากช่าง</strong>
                                    <p className="preserve-space">
                                        {ticket.completion_note}
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                    <section className="panel timeline-panel">
                        <div className="section-heading">
                            <div>
                                <h2>ประวัติและการพูดคุย</h2>
                                <p>ทุกขั้นตอนของงานนี้ ไม่หล่นหายระหว่างทาง</p>
                            </div>
                            <MessageSquare size={19} />
                        </div>
                        <div className="timeline">
                            {ticket.events?.map((e) => (
                                <article key={e.id}>
                                    <span
                                        className={`timeline-dot ${e.action}`}
                                    />
                                    <div>
                                        <strong>
                                            {e.actor.name}
                                            <small>{date(e.created_at)}</small>
                                        </strong>
                                        <p className="preserve-space">
                                            {e.message}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <form
                            className="comment-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                comment.post(`/tickets/${ticket.id}/comments`, {
                                    onSuccess: () => comment.reset(),
                                });
                            }}
                        >
                            <label>
                                เพิ่มข้อความ
                                <textarea
                                    rows={3}
                                    required
                                    minLength={2}
                                    maxLength={1500}
                                    value={comment.data.message}
                                    onChange={(e) =>
                                        comment.setData(
                                            "message",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="รายละเอียดเพิ่มเติมหรือนัดหมายกับช่าง"
                                />
                            </label>
                            <Errors errors={comment.errors} />
                            <button disabled={comment.processing}>
                                ส่งข้อความ
                            </button>
                        </form>
                    </section>
                </div>
                <aside>
                    <AppointmentPanel ticket={ticket} user={user} />
                    <section className="panel action-panel">
                        <span className="action-icon">
                            <Wrench size={23} />
                        </span>
                        <h2>ขั้นตอนถัดไป</h2>
                        {ticket.assignee ? (
                            <p>
                                ช่างผู้รับผิดชอบ:{" "}
                                <strong>{ticket.assignee.name}</strong>
                            </p>
                        ) : (
                            <p>ผู้ดูแลกำลังจัดหาช่างให้งานนี้</p>
                        )}
                        {user.role === "manager" &&
                            ["new", "assigned", "reopened"].includes(
                                ticket.status,
                            ) && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        assign.post(
                                            `/tickets/${ticket.id}/assign`,
                                        );
                                    }}
                                >
                                    <label>
                                        เลือกช่าง
                                        <select
                                            required
                                            value={assign.data.assignee_id}
                                            onChange={(e) =>
                                                assign.setData(
                                                    "assignee_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                เลือกผู้รับผิดชอบ
                                            </option>
                                            {technicians.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <Errors errors={assign.errors} />
                                    <button
                                        className="primary wide"
                                        disabled={assign.processing}
                                    >
                                        มอบหมายงาน
                                    </button>
                                </form>
                            )}
                        {user.role === "technician" &&
                            ticket.status === "assigned" && (
                                <button
                                    className="primary wide"
                                    disabled={
                                        transition.processing ||
                                        Boolean(
                                            ticket.appointment_status &&
                                            ticket.appointment_status !==
                                                "confirmed",
                                        )
                                    }
                                    onClick={() => act("start")}
                                >
                                    เริ่มดำเนินการ
                                </button>
                            )}
                        {user.role === "technician" &&
                            ticket.status === "in_progress" && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        act("finish");
                                    }}
                                >
                                    <label>
                                        รายละเอียดงานที่ทำ
                                        <textarea
                                            required
                                            minLength={5}
                                            maxLength={1500}
                                            rows={5}
                                            value={transition.data.note}
                                            onChange={(e) =>
                                                transition.setData(
                                                    "note",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="ซ่อมอะไร ทดสอบอย่างไร และข้อแนะนำหลังซ่อม"
                                        />
                                    </label>
                                    <button
                                        className="primary wide"
                                        disabled={transition.processing}
                                    >
                                        ส่งงานให้คนพักยืนยัน
                                    </button>
                                </form>
                            )}
                        {user.role === "resident" &&
                            ticket.status === "awaiting_confirmation" && (
                                <>
                                    <p className="action-hint">
                                        ลองใช้งานและตรวจผลก่อนยืนยัน
                                        หากยังมีปัญหาให้เปิดงานใหม่
                                    </p>
                                    <button
                                        className="primary wide"
                                        disabled={transition.processing}
                                        onClick={() => act("confirm")}
                                    >
                                        <CheckCircle2 size={16} />
                                        ยืนยันว่าซ่อมเสร็จแล้ว
                                    </button>
                                    <form
                                        className="reopen-form"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            act("reopen");
                                        }}
                                    >
                                        <label>
                                            ยังมีปัญหา? ระบุเหตุผล
                                            <textarea
                                                rows={3}
                                                required
                                                minLength={5}
                                                maxLength={1500}
                                                value={transition.data.note}
                                                onChange={(e) =>
                                                    transition.setData(
                                                        "note",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                        <button
                                            className="wide"
                                            disabled={transition.processing}
                                        >
                                            เปิดงานใหม่
                                        </button>
                                    </form>
                                </>
                            )}
                        {ticket.status === "closed" && (
                            <div className="closed-note">
                                <CheckCircle2 size={26} />
                                <strong>งานนี้ได้รับการยืนยันแล้ว</strong>
                                <span>
                                    {ticket.closed_at && date(ticket.closed_at)}
                                </span>
                            </div>
                        )}
                        <Errors errors={transition.errors} />
                        <div className="action-footnote">
                            การเปลี่ยนสถานะมีประวัติและแจ้งเตือนให้ผู้เกี่ยวข้องในระบบ
                        </div>
                    </section>
                    <div className="detail-help">
                        รูปแนบเป็นข้อมูลส่วนตัว
                        <br />
                        เฉพาะผู้เกี่ยวข้องกับงานนี้ที่เปิดดูได้
                    </div>
                </aside>
            </div>
        </Layout>
    );
}
