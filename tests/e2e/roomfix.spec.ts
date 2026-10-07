import { test, expect, type Page } from "@playwright/test";
const password = "RoomFixDemo!2026";
async function login(page: Page, account: string) {
    await page.goto("/login");
    await page
        .getByLabel("อีเมล", { exact: true })
        .fill(`${account}@roomfix.test`);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
    await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: /สวัสดี/ })).toBeVisible();
}
async function logout(page: Page) {
    await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
}
test("resident, manager and technician complete a real repair with private photo and audit trail", async ({
    page,
}) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await login(page, "resident");
    await page.getByRole("link", { name: "แจ้งซ่อมใหม่", exact: true }).click();
    const title = `ทดสอบก๊อกน้ำรั่ว ${Date.now()}`;
    await page.getByLabel("หัวข้อปัญหา").fill(title);
    await page
        .getByLabel("รายละเอียด", { exact: true })
        .fill("ก๊อกน้ำหยดตลอดทั้งวัน กรุณาช่วยตรวจและเปลี่ยนยางรอง");
    await page
        .getByLabel("แนบรูปปัญหา")
        .setInputFiles({
            name: "problem.png",
            mimeType: "image/png",
            buffer: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9kAAAAASUVORK5CYII=",
                "base64",
            ),
        });
    await page.getByRole("button", { name: "ส่งคำขอแจ้งซ่อม" }).click();
    await expect(
        page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    const ticketUrl = new URL(page.url()).pathname;
    const photo = page.getByRole("img", { name: /รูปปัญหาที่แนบ/ });
    await expect(photo).toBeVisible();
    const photoUrl = await photo.getAttribute("src");
    expect((await page.request.get(photoUrl!)).status()).toBe(200);
    await expect(page.locator(".page-heading .status")).toHaveText("รอมอบหมาย");
    await logout(page);
    await login(page, "resident2");
    expect((await page.request.get(photoUrl!)).status()).toBe(403);
    expect((await page.request.get(ticketUrl)).status()).toBe(403);
    await logout(page);
    await login(page, "manager");
    await page.goto(ticketUrl);
    await page.getByLabel("เลือกช่าง").selectOption({ label: "ช่างต้น" });
    await page.getByRole("button", { name: "มอบหมายงาน", exact: true }).click();
    await expect(page.locator(".page-heading .status")).toHaveText(
        "มอบหมายแล้ว",
    );
    await logout(page);
    await login(page, "tech");
    await page.goto(ticketUrl);
    await page.getByRole("button", { name: "เริ่มดำเนินการ" }).click();
    await expect(page.locator(".page-heading .status")).toHaveText("กำลังซ่อม");
    await page
        .getByLabel("รายละเอียดงานที่ทำ")
        .fill("เปลี่ยนยางรองก๊อกและทดสอบเปิดปิดน้ำแล้ว ไม่มีน้ำหยด");
    await page.getByRole("button", { name: "ส่งงานให้คนพักยืนยัน" }).click();
    await expect(page.locator(".page-heading .status")).toHaveText("รอยืนยัน");
    await logout(page);
    await login(page, "resident");
    await page.goto(ticketUrl);
    await page.getByRole("button", { name: "ยืนยันว่าซ่อมเสร็จแล้ว" }).click();
    await expect(page.locator(".page-heading .status")).toHaveText(
        "ปิดงานแล้ว",
    );
    await expect(page.getByText("งานนี้ได้รับการยืนยันแล้ว")).toBeVisible();
    await expect(page.locator(".timeline article")).toHaveCount(5);
    await page.getByLabel("เพิ่มข้อความ").fill("ขอบคุณค่ะ ใช้งานได้ปกติแล้ว");
    await page.getByRole("button", { name: "ส่งข้อความ", exact: true }).click();
    await expect(page.locator(".timeline article")).toHaveCount(6);
    await page
        .getByRole("link", { name: "เปิดการแจ้งเตือน", exact: true })
        .click();
    await expect(
        page.getByRole("heading", { name: "อัปเดตที่เกี่ยวกับคุณ" }),
    ).toBeVisible();
    await expect(
        page.locator(".notification").filter({ hasText: "ซ่อมเสร็จ" }),
    ).not.toHaveCount(0);
    expect(errors).toEqual([]);
});
test("manager filters jobs, creates a resident, and dashboard has no client errors", async ({
    page,
}) => {
    await login(page, "manager");
    await page.screenshot({
        path: "docs/dashboard-desktop.png",
        fullPage: true,
    });
    await page
        .getByRole("link", { name: "รายการแจ้งซ่อม", exact: true })
        .click();
    await page.getByLabel("ค้นหางานหรือห้อง").fill("ก๊อกน้ำ");
    await page.getByRole("button", { name: "ค้นหา", exact: true }).click();
    await expect(page).toHaveURL(/q=/);
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await page.getByRole("link", { name: "ผู้ใช้งาน", exact: true }).click();
    const name = `ผู้พักทดสอบ ${Date.now()}`;
    await page.getByLabel("ชื่อผู้ใช้งาน").fill(name);
    await page
        .getByLabel("อีเมล", { exact: true })
        .fill(`test-${Date.now()}@roomfix.test`);
    await page.getByLabel("เลขห้อง").fill("C-102");
    await page.getByLabel("รหัสผ่านเริ่มต้น").fill("ResidentTest!2026");
    await page.getByRole("button", { name: "สร้างบัญชี", exact: true }).click();
    await expect(
        page.locator(".users-list").getByText(name, { exact: true }),
    ).toBeVisible();
});
test("mobile navigation and login remain usable without horizontal page overflow", async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(
        page.getByRole("heading", { name: "ยินดีต้อนรับกลับ" }),
    ).toBeVisible();
    await page.screenshot({ path: "docs/login-mobile.png", fullPage: true });
    await login(page, "resident");
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: "docs/dashboard-mobile.png",
        fullPage: true,
    });
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
    await page
        .getByRole("link", { name: "รายการแจ้งซ่อม", exact: true })
        .click();
    await expect(
        page.getByRole("heading", { name: "รายการแจ้งซ่อม", exact: true }),
    ).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.getByRole("link", { name: "แจ้งซ่อมใหม่", exact: true }).click();
    await expect(page.getByLabel("หัวข้อปัญหา")).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
});
