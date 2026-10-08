import { test, expect } from "@playwright/test";

test("isolated demo protects shared accounts and accepts fictional repairs", async ({
    page,
}) => {
    test.skip(
        process.env.ROOMFIX_E2E_DEMO !== "true",
        "Run against the dedicated demo runtime only",
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/login");
    await expect(
        page.getByText(
            "พื้นที่ทดลองร่วมกัน · ใช้ข้อมูลสมมติเท่านั้น · งานอาจถูกรีเซ็ต",
        ),
    ).toBeVisible();
    await page.getByRole("button", { name: "ผู้ดูแล", exact: true }).click();
    await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("note")).toContainText("พื้นที่ทดลองร่วมกัน");
    await page.getByRole("link", { name: "ผู้ใช้งาน", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "บัญชีตัวอย่างพร้อมใช้งาน" }),
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "สร้างบัญชี", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "ตั้งค่าบัญชี", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "บัญชีทดลองใช้ร่วมกัน" }),
    ).toBeVisible();
    await expect(page.getByLabel("รหัสผ่านใหม่", { exact: true })).toHaveCount(
        0,
    );
    await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole("button", { name: "คนพัก", exact: true }).click();
    await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("link", { name: "แจ้งซ่อมใหม่", exact: true }).click();
    await page.getByLabel("หัวข้อปัญหา").fill(`ข้อมูลเดโมแยก ${Date.now()}`);
    await page
        .getByLabel("รายละเอียด", { exact: true })
        .fill("ข้อมูลสมมติสำหรับทดสอบพื้นที่เดโมที่แยกจากระบบหลัก");
    await page.getByRole("button", { name: "ส่งคำขอแจ้งซ่อม" }).click();
    await expect(
        page.getByRole("heading", { name: /ข้อมูลเดโมแยก/ }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: "docs/demo-mobile.png",
        fullPage: true,
        animations: "disabled",
    });
    const cookies = await page.context().cookies();
    expect(
        cookies.some((cookie) => cookie.name === "roomfix_demo_session"),
    ).toBe(true);
    expect(errors).toEqual([]);
});
