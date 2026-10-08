import { Link, router, usePage } from "@inertiajs/react";
import { Search } from "lucide-react";
import { useState } from "react";
import Layout, { NewTicketButton, PageHeading } from "../components/Layout";
import TicketTable from "../components/TicketTable";
import { statuses, type Shared, type Ticket } from "../types";
type Pagination = {
    data: Ticket[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
export default function Tickets({
    tickets,
    filters,
}: {
    tickets: Pagination;
    filters: { q?: string; status?: string; overdue?: string | boolean };
}) {
    const user = usePage<Shared>().props.auth.user!;
    const [search, setSearch] = useState(filters.q ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [overdue, setOverdue] = useState(
        filters.overdue === true || filters.overdue === "1",
    );
    return (
        <Layout title="รายการแจ้งซ่อม">
            <PageHeading
                title={
                    user.role === "technician"
                        ? "งานที่ได้รับมอบหมาย"
                        : "รายการแจ้งซ่อม"
                }
                subtitle={`${tickets.total} งานในรายการ · ดูประวัติและติดตามสถานะได้ทุกขั้นตอน`}
            >
                {user.role === "resident" && <NewTicketButton />}
            </PageHeading>
            <section className="panel">
                <form
                    className="filters"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(
                            "/tickets",
                            { q: search, status, overdue: overdue ? 1 : 0 },
                            { preserveState: true, replace: true },
                        );
                    }}
                >
                    <label className="search">
                        <Search size={17} />
                        <input
                            aria-label="ค้นหางานหรือห้อง"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาหัวข้อหรือเลขห้อง"
                            maxLength={80}
                        />
                    </label>
                    <select
                        aria-label="กรองสถานะ"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">ทุกสถานะ</option>
                        {Object.entries(statuses).map(([k, label]) => (
                            <option key={k} value={k}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <label className="overdue-toggle">
                        <input
                            type="checkbox"
                            checked={overdue}
                            onChange={(e) => setOverdue(e.target.checked)}
                        />
                        งานค้างเกิน 3 วัน
                    </label>
                    <button>ค้นหา</button>
                    {(filters.q ||
                        filters.status ||
                        filters.overdue === true ||
                        filters.overdue === "1") && (
                        <Link href="/tickets" className="button quiet">
                            ล้างตัวกรอง
                        </Link>
                    )}
                </form>
                <TicketTable tickets={tickets.data} />
                <div className="pagination">
                    <span>
                        หน้า {tickets.current_page} / {tickets.last_page}
                    </span>
                    <div>
                        {tickets.prev_page_url && (
                            <Link
                                href={tickets.prev_page_url}
                                className="button"
                            >
                                ก่อนหน้า
                            </Link>
                        )}
                        {tickets.next_page_url && (
                            <Link
                                href={tickets.next_page_url}
                                className="button"
                            >
                                ถัดไป
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
