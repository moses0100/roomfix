import { Link, useForm } from "@inertiajs/react";
import { Bell, CheckCheck } from "lucide-react";
import Layout, { PageHeading } from "../components/Layout";
import { date } from "../types";
type Notification = {
    id: string;
    data: { ticket_id: number; message: string };
    read_at: string | null;
    created_at: string;
};
export default function Notifications({
    notifications,
}: {
    notifications: Notification[];
}) {
    const form = useForm({});
    return (
        <Layout title="การแจ้งเตือน">
            <PageHeading
                title="อัปเดตที่เกี่ยวกับคุณ"
                subtitle="การแจ้งเตือนในระบบ ไม่ต้องไล่หาข้อความในแชท"
            >
                <button
                    disabled={form.processing}
                    onClick={() => form.post("/notifications/read")}
                >
                    <CheckCheck size={16} />
                    ทำเครื่องหมายอ่านทั้งหมด
                </button>
            </PageHeading>
            <section className="panel notifications">
                {notifications.length ? (
                    notifications.map((n) => (
                        <Link
                            key={n.id}
                            href={`/tickets/${n.data.ticket_id}`}
                            className={
                                n.read_at ? "notification read" : "notification"
                            }
                        >
                            <span>
                                <Bell size={18} />
                            </span>
                            <div>
                                <strong>{n.data.message}</strong>
                                <small>
                                    RF-
                                    {String(n.data.ticket_id).padStart(4, "0")}{" "}
                                    · {date(n.created_at)}
                                </small>
                            </div>
                            {!n.read_at && <i />}
                        </Link>
                    ))
                ) : (
                    <div className="empty">
                        <Bell size={29} />
                        <h3>ยังไม่มีการแจ้งเตือน</h3>
                        <p>
                            เมื่อมีการอัปเดตงานที่เกี่ยวข้อง ข้อความจะแสดงที่นี่
                        </p>
                    </div>
                )}
            </section>
        </Layout>
    );
}
