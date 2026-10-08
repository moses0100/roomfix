import { test, expect, type Page } from "@playwright/test";
test.use({ timezoneId: "America/New_York" });
async function login(page: Page, account: string) {
    await page.goto("/login");
    await page
        .getByLabel("อีเมล", { exact: true })
        .fill(`${account}@roomfix.test`);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill("RoomFixDemo!2026");
    await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);
}
async function logout(page: Page) {
    await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
}
test("appointment is confirmed by resident before technician starts, with Thai time independent of browser timezone", async ({
    page,
}) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const title = `นัดเข้าซ่อมทดสอบ ${Date.now()}`;
    await login(page, "resident");
    await page.getByRole("link", { name: "แจ้งซ่อมใหม่", exact: true }).click();
    await page.getByLabel("หัวข้อปัญหา").fill(title);
    await page
        .getByLabel("รายละเอียด", { exact: true })
        .fill("ก๊อกน้ำรั่ว อยากนัดให้ช่างเข้าตรวจในเวลาที่อยู่ห้อง");
    await page.getByRole("button", { name: "ส่งคำขอแจ้งซ่อม" }).click();
    await expect(
        page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    const ticketUrl = new URL(page.url()).pathname;
    await logout(page);
    await login(page, "manager");
    await page.goto(ticketUrl);
    await page.getByLabel("เลือกช่าง").selectOption({ label: "ช่างต้น" });
    await page.getByRole("button", { name: "มอบหมายงาน", exact: true }).click();
    await expect(page.locator(".page-heading .status")).toHaveText(
        "มอบหมายแล้ว",
    );
    const day = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    await page
        .getByLabel("เริ่มนัด (เวลาไทย)", { exact: true })
        .fill(`${day}T09:00`);
    await page
        .getByLabel("สิ้นสุดนัด (เวลาไทย)", { exact: true })
        .fill(`${day}T10:00`);
    await page
        .getByLabel("รายละเอียดนัด", { exact: true })
        .fill("เตรียมพื้นที่ใต้ซิงก์ก่อนเข้าซ่อม");
    const proposal = page.waitForRequest(
        (r) => r.url().endsWith("/appointment") && r.method() === "POST",
    );
    await page
        .getByRole("button", { name: "เสนอนัดเข้าซ่อม", exact: true })
        .click();
    expect((await proposal).postDataJSON().start).toBe(`${day}T02:00:00.000Z`);
    await expect(page.locator(".appointment-badge")).toHaveText(
        "รอคนพักยืนยันนัด",
    );
    await logout(page);
    await login(page, "tech");
    await page.goto(ticketUrl);
    await expect(
        page.getByRole("button", { name: "เริ่มดำเนินการ", exact: true }),
    ).toBeDisabled();
    await logout(page);
    await login(page, "resident");
    await page.goto(ticketUrl);
    await expect(page.locator(".appointment-time")).toContainText("09:00");
    await page
        .getByRole("button", { name: "ยืนยันนัดเข้าซ่อม", exact: true })
        .click();
    await expect(page.locator(".appointment-badge")).toHaveText(
        "ยืนยันนัดแล้ว",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: "docs/appointment-mobile.png",
        animations: "disabled",
        fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
        path: "docs/appointment-desktop.png",
        animations: "disabled",
        fullPage: true,
    });
    await logout(page);
    await login(page, "tech");
    await page.goto(ticketUrl);
    await expect(
        page.getByRole("button", { name: "เริ่มดำเนินการ", exact: true }),
    ).toBeEnabled();
    await page
        .getByRole("button", { name: "เริ่มดำเนินการ", exact: true })
        .click();
    await expect(page.locator(".page-heading .status")).toHaveText("กำลังซ่อม");
    await page
        .getByLabel("รายละเอียดงานที่ทำ")
        .fill("ตรวจและเปลี่ยนยางรอง ทดสอบใช้งานแล้ว");
    await page
        .getByRole("button", { name: "ส่งงานให้คนพักยืนยัน", exact: true })
        .click();
    await expect(page.locator(".page-heading .status")).toHaveText("รอยืนยัน");
    await logout(page);
    await login(page, "resident");
    await page.goto(ticketUrl);
    await page
        .getByRole("button", { name: "ยืนยันว่าซ่อมเสร็จแล้ว", exact: true })
        .click();
    await expect(page.locator(".page-heading .status")).toHaveText(
        "ปิดงานแล้ว",
    );
    await expect(page.locator(".timeline article")).toHaveCount(7);
    expect(errors).toEqual([]);
});
