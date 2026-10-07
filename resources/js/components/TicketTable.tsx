import { Link } from "@inertiajs/react";
import {
    ArrowUpRight,
    Droplets,
    PlugZap,
    Snowflake,
    DoorOpen,
    Wrench,
    Image,
} from "lucide-react";
import { categories, date, statuses, type Ticket } from "../types";
export const categoryIcons: Record<string, typeof Wrench> = {
    plumbing: Droplets,
    electrical: PlugZap,
    aircon: Snowflake,
    structure: DoorOpen,
    other: Wrench,
};
export function Status({ value }: { value: string }) {
    return (
        <span className={`status ${value}`}>{statuses[value] ?? value}</span>
    );
}
export default function TicketTable({ tickets }: { tickets: Ticket[] }) {
    return tickets.length ? (
        <div className="table-scroll">
            <table className="ticket-table">
                <thead>
                    <tr>
                        <th>งานซ่อม</th>
                        <th>ห้อง / ผู้แจ้ง</th>
                        <th>ช่างผู้ดูแล</th>
                        <th>สถานะ</th>
                        <th>แจ้งเมื่อ</th>
                        <th aria-label="เปิดรายละเอียด" />
                    </tr>
                </thead>
                <tbody>
                    {tickets.map((t) => {
                        const Icon = categoryIcons[t.category] ?? Wrench;
                        return (
                            <tr key={t.id}>
                                <td>
                                    <Link
                                        href={`/tickets/${t.id}`}
                                        className="ticket-title"
                                    >
                                        <span
                                            className={`category-icon ${t.category}`}
                                        >
                                            <Icon size={19} />
                                        </span>
                                        <span>
                                            <strong>{t.title}</strong>
                                            <small>
                                                RF-
                                                {String(t.id).padStart(4, "0")}{" "}
                                                · {categories[t.category]}
                                                {t.urgency !== "normal" && (
                                                    <em> · เร่งด่วน</em>
                                                )}
                                                {!!t.photos_count && (
                                                    <>
                                                        <Image size={12} />{" "}
                                                        {t.photos_count}
                                                    </>
                                                )}
                                            </small>
                                        </span>
                                    </Link>
                                </td>
                                <td>
                                    <strong>{t.room}</strong>
                                    <small>{t.resident.name}</small>
                                </td>
                                <td>
                                    {t.assignee ? (
                                        <span className="technician">
                                            <span>
                                                {t.assignee.name.slice(0, 1)}
                                            </span>
                                            {t.assignee.name}
                                        </span>
                                    ) : (
                                        <span className="muted">
                                            ยังไม่มอบหมาย
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <Status value={t.status} />
                                </td>
                                <td className="date-cell">
                                    {date(t.created_at)}
                                </td>
                                <td>
                                    <Link
                                        href={`/tickets/${t.id}`}
                                        aria-label={`เปิดงาน RF-${t.id}`}
                                        className="arrow-link"
                                    >
                                        <ArrowUpRight size={17} />
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    ) : (
        <div className="empty">
            <Wrench size={30} />
            <h3>ยังไม่มีงานในรายการนี้</h3>
            <p>
                งานที่คุณมีสิทธิ์ดูจะแสดงที่นี่ ลองเปลี่ยนตัวกรองหรือแจ้งงานใหม่
            </p>
        </div>
    );
}
