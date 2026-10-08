import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Bell,
    Building2,
    Check,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    Plus,
    Settings,
    Users,
    Wrench,
    X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { roles, type Shared } from "../types";
export default function Layout({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const { auth, building, unread, flash } = usePage<Shared>().props;
    const user = auth.user!;
    const [open, setOpen] = useState(false);
    const url = usePage().url;
    const links = [
        { href: "/dashboard", label: "ภาพรวม", Icon: LayoutDashboard },
        {
            href: "/tickets",
            label:
                user.role === "technician"
                    ? "งานที่ได้รับมอบหมาย"
                    : "รายการแจ้งซ่อม",
            Icon: ClipboardList,
        },
        { href: "/notifications", label: "การแจ้งเตือน", Icon: Bell },
        ...(user.role === "manager"
            ? [{ href: "/users", label: "ผู้ใช้งาน", Icon: Users }]
            : []),
        { href: "/settings", label: "ตั้งค่าบัญชี", Icon: Settings },
    ];
    return (
        <>
            <Head title={title} />
            <div className="shell">
                <aside className={open ? "sidebar open" : "sidebar"}>
                    <Link href="/dashboard" className="brand">
                        <span>
                            <Wrench size={23} />
                        </span>
                        Room<strong>Fix</strong>
                    </Link>
                    <button
                        className="mobile close-menu"
                        aria-label="ปิดเมนู"
                        onClick={() => setOpen(false)}
                    >
                        <X />
                    </button>
                    <div className="building">
                        <Building2 size={17} />
                        <div>
                            <strong>{building}</strong>
                            <small>ระบบดูแลงานซ่อม · 1 อาคาร</small>
                        </div>
                    </div>
                    <div className="nav-label">พื้นที่ทำงาน</div>
                    <nav>
                        {links.map(({ href, label, Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={
                                    url.split("?")[0].startsWith(href)
                                        ? "nav-link active"
                                        : "nav-link"
                                }
                                onClick={() => setOpen(false)}
                            >
                                <Icon size={18} />
                                {label}
                                {href === "/notifications" && unread > 0 && (
                                    <b>{unread}</b>
                                )}
                            </Link>
                        ))}
                    </nav>
                    <div className="sidebar-note">
                        <span className="live-dot" />
                        แจ้ง • มอบหมาย • ติดตาม
                        <p>
                            ทุกขั้นตอนมีประวัติ
                            <br />
                            เพื่อให้งานซ่อมไม่ตกหล่น
                        </p>
                    </div>
                    <div className="profile">
                        <span className="avatar">{user.name.slice(0, 1)}</span>
                        <div>
                            <strong>{user.name}</strong>
                            <small>
                                {roles[user.role]}{" "}
                                {user.room ? `· ${user.room}` : ""}
                            </small>
                        </div>
                        <button
                            aria-label="ออกจากระบบ"
                            onClick={() => router.post("/logout")}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </aside>
                <div className="main-area">
                    <header className="topbar">
                        <div>
                            <button
                                className="mobile"
                                aria-label="เปิดเมนู"
                                onClick={() => setOpen(true)}
                            >
                                <Menu size={20} />
                            </button>
                            <span>พื้นที่ทำงาน</span>
                            <i>/</i>
                            <strong>{title}</strong>
                        </div>
                        <div>
                            <Link
                                href="/notifications"
                                className="notification-button"
                                aria-label="เปิดการแจ้งเตือน"
                            >
                                <Bell size={19} />
                                {unread > 0 && <b>{unread}</b>}
                            </Link>
                            <span className="role-tag">{roles[user.role]}</span>
                        </div>
                    </header>
                    <main>
                        {flash.success && (
                            <div className="flash" role="status">
                                <Check size={17} />
                                <span>{flash.success}</span>
                            </div>
                        )}
                        {children}
                    </main>
                    <footer>
                        <span>RoomFix · งานซ่อมเป็นระบบ ชีวิตง่ายขึ้น</span>
                        <span>อาคารเดียว · สิทธิ์ตามบทบาท</span>
                    </footer>
                </div>
            </div>
        </>
    );
}
export function PageHeading({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children?: ReactNode;
}) {
    return (
        <div className="page-heading">
            <div>
                <div className="eyebrow">ROOMFIX / WORKSPACE</div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            {children}
        </div>
    );
}
export function NewTicketButton() {
    return (
        <Link href="/tickets/create" className="button primary">
            <Plus size={17} />
            แจ้งซ่อมใหม่
        </Link>
    );
}
export function Errors({
    errors,
}: {
    errors: Record<string, string | undefined>;
}) {
    const values = Object.values(errors).filter(Boolean);
    return values.length ? (
        <div className="errors" role="alert">
            {[...new Set(values)].map((e, i) => (
                <p key={i}>{e}</p>
            ))}
        </div>
    ) : null;
}
