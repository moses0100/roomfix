import { router, usePage } from "@inertiajs/react";
import { Download } from "lucide-react";
import { useState } from "react";
import Layout, { Errors, PageHeading } from "../components/Layout";
import { categories as categoryLabels, statuses, type Shared } from "../types";

type Report = {
    filters: { from: string; to: string };
    counts: Record<string, number>;
    categories: Record<string, number>;
    overdue: number;
    total: number;
};
export default function Reports({
    filters,
    counts,
    categories,
    overdue,
    total,
}: Report) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const { errors } = usePage<Shared>().props;
    const query = new URLSearchParams(filters).toString();
    return (
        <Layout title="รายงานงานซ่อม">
            <PageHeading
                title="รายงานงานซ่อม"
                subtitle="สรุปงานตามวันที่แจ้งซ่อม · เวลาประเทศไทย"
            >
                <a className="button primary" href={`/reports/export?${query}`}>
                    <Download size={17} /> ดาวน์โหลด CSV
                </a>
            </PageHeading>
            <section className="panel report-filter-panel">
                <form
                    className="report-filters"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            "/reports",
                            { from, to },
                            { preserveState: true, replace: true },
                        );
                    }}
                >
                    <label>
                        วันที่แจ้งตั้งแต่
                        <input
                            type="date"
                            required
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                        />
                    </label>
                    <label>
                        ถึงวันที่
                        <input
                            type="date"
                            required
                            value={to}
                            min={from}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </label>
                    <button className="button primary">แสดงรายงาน</button>
                </form>
                <Errors errors={(errors ?? {}) as Record<string, string>} />
                <p className="report-caption">
                    รายงานที่แสดง: {filters.from} ถึง {filters.to} · CSV
                    ใช้ช่วงวันที่นี้
                </p>
                <p className="report-caption">
                    นับงานที่แจ้งในช่วงนี้ตามสถานะปัจจุบัน
                    ไม่ใช่จำนวนงานที่ปิดในช่วงนี้
                </p>
            </section>
            <div className="stats-grid report-stats">
                {[
                    ["งานที่แจ้งในช่วงนี้", total],
                    ["ปิดงานแล้ว", counts.closed ?? 0],
                    ["ยังไม่ปิดงาน", total - Number(counts.closed ?? 0)],
                    ["งานค้างเกิน 3 วัน", overdue],
                ].map(([label, value]) => (
                    <article className="stat-card" key={label}>
                        <span>{label}</span>
                        <strong>
                            {value}
                            <small> งาน</small>
                        </strong>
                    </article>
                ))}
            </div>
            {total === 0 && (
                <p className="report-empty" role="status">
                    ไม่มีงานที่แจ้งในช่วงวันที่นี้ ลองเลือกช่วงวันที่อื่นได้ครับ
                </p>
            )}
            <div className="report-breakdowns">
                {[
                    { title: "แยกตามสถานะ", labels: statuses, values: counts },
                    {
                        title: "แยกตามประเภทงาน",
                        labels: categoryLabels,
                        values: categories,
                    },
                ].map(({ title, labels, values }) => (
                    <section className="panel" key={title}>
                        <div className="section-heading">
                            <h2>{title}</h2>
                        </div>
                        <ul className="report-distribution">
                            {Object.entries(labels).map(([key, label]) => (
                                <li key={key}>
                                    <div>
                                        <span>{label}</span>
                                        <strong>{values[key] ?? 0} งาน</strong>
                                    </div>
                                    <progress
                                        aria-label={label}
                                        max={Math.max(total, 1)}
                                        value={Number(values[key] ?? 0)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </Layout>
    );
}
