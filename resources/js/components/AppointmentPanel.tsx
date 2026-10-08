import { useForm } from "@inertiajs/react";
import { CalendarClock } from "lucide-react";
import {
    appointmentDate,
    appointmentStatuses,
    type Ticket,
    type User,
} from "../types";
import { Errors } from "./Layout";
function inputTime(value: string) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(value));
    const part = (key: string) => parts.find((p) => p.type === key)!.value;
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
export default function AppointmentPanel({
    ticket,
    user,
}: {
    ticket: Ticket;
    user: User;
}) {
    const suggestedStart = Date.now() + 86400000;
    const form = useForm({
        action: "",
        version: ticket.appointment_version,
        start: inputTime(
            ticket.appointment_start ?? new Date(suggestedStart).toISOString(),
        ),
        end: inputTime(
            ticket.appointment_end ??
                new Date(suggestedStart + 3600000).toISOString(),
        ),
        note: "",
    });
    const submit = (action: string) => {
        form.transform((data) => ({
            ...data,
            action,
            version: ticket.appointment_version,
            ...(action === "propose"
                ? {
                      start: new Date(`${data.start}:00+07:00`).toISOString(),
                      end: new Date(`${data.end}:00+07:00`).toISOString(),
                  }
                : {}),
        }));
        form.post(`/tickets/${ticket.id}/appointment`, {
            onSuccess: () => form.reset("note"),
        });
    };
    const editable = ticket.status === "assigned";
    const pending = ticket.appointment_status === "pending";
    const needsConfirmation =
        editable &&
        ticket.appointment_status &&
        ticket.appointment_status !== "confirmed";
    return (
        <section className="panel appointment-panel">
            <div className="section-heading">
                <div>
                    <h2>
                        <CalendarClock size={18} />
                        นัดเข้าซ่อม
                    </h2>
                    <p>วันเวลาใช้เวลาประเทศไทย (UTC+7)</p>
                </div>
            </div>
            <div className="appointment-content">
                {ticket.appointment_status &&
                ticket.appointment_start &&
                ticket.appointment_end ? (
                    <>
                        <span
                            className={`appointment-badge ${ticket.appointment_status}`}
                        >
                            {appointmentStatuses[ticket.appointment_status]}
                        </span>
                        <strong className="appointment-time">
                            {appointmentDate(ticket.appointment_start)}
                            <br />
                            ถึง {appointmentDate(ticket.appointment_end)}
                        </strong>
                        {ticket.appointment_note && (
                            <p className="preserve-space">
                                รายละเอียดนัด: {ticket.appointment_note}
                            </p>
                        )}
                        {ticket.appointment_response_note && (
                            <p className="preserve-space">
                                เหตุผลที่ไม่สะดวก:{" "}
                                {ticket.appointment_response_note}
                            </p>
                        )}
                    </>
                ) : (
                    <p>
                        ยังไม่มีนัดเข้าซ่อม
                        ผู้ดูแลสามารถเสนอเวลาได้หลังมอบหมายช่าง
                    </p>
                )}
                {user.role === "manager" && editable && (
                    <>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit("propose");
                            }}
                        >
                            <label>
                                เริ่มนัด (เวลาไทย)
                                <input
                                    required
                                    type="datetime-local"
                                    value={form.data.start}
                                    onChange={(e) =>
                                        form.setData("start", e.target.value)
                                    }
                                />
                            </label>
                            <label>
                                สิ้นสุดนัด (เวลาไทย)
                                <input
                                    required
                                    type="datetime-local"
                                    value={form.data.end}
                                    onChange={(e) =>
                                        form.setData("end", e.target.value)
                                    }
                                />
                            </label>
                            <label>
                                รายละเอียดนัด
                                <textarea
                                    maxLength={500}
                                    rows={3}
                                    value={form.data.note}
                                    onChange={(e) =>
                                        form.setData("note", e.target.value)
                                    }
                                    placeholder="เช่น เตรียมพื้นที่ใต้ซิงก์ก่อนช่างเข้า"
                                />
                            </label>
                            <small>
                                ช่วงนัดสูงสุด 4 ชั่วโมง ภายใน 90 วัน
                                ช่วงรอยืนยันจะจองเวลาช่างไว้ด้วย
                            </small>
                            <button
                                className="primary wide"
                                disabled={form.processing}
                            >
                                {ticket.appointment_status
                                    ? "เสนอนัดใหม่"
                                    : "เสนอนัดเข้าซ่อม"}
                            </button>
                        </form>
                        {ticket.appointment_status &&
                            ticket.appointment_status !== "cancelled" && (
                                <button
                                    className="wide cancel-appointment"
                                    disabled={form.processing}
                                    onClick={() => submit("cancel")}
                                >
                                    ยกเลิกนัดเข้าซ่อม
                                </button>
                            )}
                    </>
                )}
                {user.role === "resident" && editable && pending && (
                    <>
                        <p className="appointment-hint">
                            ตรวจวันเวลาและความพร้อมก่อนยืนยัน
                            หากไม่สะดวกให้แจ้งเหตุผลกับผู้ดูแล
                        </p>
                        <button
                            className="primary wide"
                            disabled={form.processing}
                            onClick={() => submit("confirm")}
                        >
                            ยืนยันนัดเข้าซ่อม
                        </button>
                        <form
                            className="reopen-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit("decline");
                            }}
                        >
                            <label>
                                เหตุผลที่ไม่สะดวก
                                <textarea
                                    required
                                    minLength={5}
                                    maxLength={500}
                                    rows={3}
                                    value={form.data.note}
                                    onChange={(e) =>
                                        form.setData("note", e.target.value)
                                    }
                                    placeholder="ระบุช่วงเวลาที่สะดวกให้ผู้ดูแลเลือกนัดใหม่"
                                />
                            </label>
                            <button className="wide" disabled={form.processing}>
                                ไม่สะดวกตามนัดนี้
                            </button>
                        </form>
                    </>
                )}
                {user.role === "technician" && needsConfirmation && (
                    <p className="appointment-hint">
                        รอผู้ดูแลและคนพักตกลงนัดให้เรียบร้อยก่อนเริ่มงาน
                    </p>
                )}
                <Errors errors={form.errors} />
            </div>
        </section>
    );
}
