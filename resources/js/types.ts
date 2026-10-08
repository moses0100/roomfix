export type User = {
    id: number;
    name: string;
    email?: string;
    role: "manager" | "resident" | "technician";
    room?: string | null;
};
export type Ticket = {
    id: number;
    title: string;
    description: string;
    category: string;
    urgency: string;
    status: string;
    room: string;
    resident_id: number;
    assignee_id: number | null;
    resident: User;
    assignee: User | null;
    created_at: string;
    updated_at: string;
    completion_note?: string | null;
    closed_at?: string | null;
    appointment_start: string | null;
    appointment_end: string | null;
    appointment_status:
        "pending" | "confirmed" | "declined" | "cancelled" | null;
    appointment_version: number;
    appointment_note: string | null;
    appointment_response_note: string | null;
    photos?: { id: number; mime: string }[];
    photos_count?: number;
    events?: {
        id: number;
        actor: User;
        action: string;
        message: string;
        created_at: string;
    }[];
};
export type Shared = {
    [key: string]: unknown;
    auth: { user: User | null };
    building: string;
    demo: boolean;
    isolated_demo: boolean;
    unread: number;
    flash: { success?: string };
};
export const statuses: Record<string, string> = {
    new: "รอมอบหมาย",
    assigned: "มอบหมายแล้ว",
    in_progress: "กำลังซ่อม",
    awaiting_confirmation: "รอยืนยัน",
    closed: "ปิดงานแล้ว",
    reopened: "เปิดงานใหม่",
};
export const categories: Record<string, string> = {
    plumbing: "ประปา",
    electrical: "ไฟฟ้า",
    aircon: "เครื่องปรับอากาศ",
    structure: "อาคาร / ประตู",
    other: "อื่น ๆ",
};
export const urgencies: Record<string, string> = {
    normal: "ปกติ",
    high: "เร่งด่วน",
    urgent: "ต้องติดต่อทันที",
};
export const roles: Record<string, string> = {
    manager: "ผู้ดูแลอาคาร",
    resident: "ผู้พักอาศัย",
    technician: "ช่างซ่อม",
};
export const date = (value: string) =>
    new Date(value).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
export const appointmentDate = (value: string) =>
    new Date(value).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
export const appointmentStatuses = {
    pending: "รอคนพักยืนยันนัด",
    confirmed: "ยืนยันนัดแล้ว",
    declined: "คนพักไม่สะดวก",
    cancelled: "ยกเลิกนัดแล้ว",
};
