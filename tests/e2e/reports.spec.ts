import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("manager filters a report, downloads its CSV, and uses it on mobile", async ({
    page,
}) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/login");
    await page
        .getByLabel("อีเมล", { exact: true })
        .fill("manager@roomfix.test");
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill("RoomFixDemo!2026");
    await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page
        .getByRole("link", { name: "รายงานงานซ่อม", exact: true })
        .click();
    await expect(
        page.getByRole("heading", { name: "รายงานงานซ่อม", exact: true }),
    ).toBeVisible();
    await page.getByLabel("วันที่แจ้งตั้งแต่").fill("2000-01-01");
    await page.getByRole("button", { name: "แสดงรายงาน", exact: true }).click();
    await expect(page).toHaveURL(/from=2000-01-01/);
    await expect(
        page.getByRole("link", { name: "ดาวน์โหลด CSV" }),
    ).toHaveAttribute("href", /from=2000-01-01/);
    await page.screenshot({
        path: "docs/reports-desktop.png",
        fullPage: true,
        animations: "disabled",
    });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "ดาวน์โหลด CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
        /^roomfix-2000-01-01-to-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    const content = await readFile((await download.path())!, "utf8");
    expect(content.startsWith("\uFEFF")).toBe(true);
    expect(content).toContain("รหัสงาน");
    expect(content).toContain("A-203");
    expect(content).not.toContain("@roomfix.test");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByLabel("วันที่แจ้งตั้งแต่")).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: "docs/reports-mobile.png",
        fullPage: true,
        animations: "disabled",
    });
    await page.getByLabel("วันที่แจ้งตั้งแต่").fill("2000-01-01");
    await page.getByLabel("ถึงวันที่").fill("2000-01-01");
    await page.getByRole("button", { name: "แสดงรายงาน", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
        "ไม่มีงานที่แจ้งในช่วงวันที่นี้",
    );
    expect(errors).toEqual([]);
});

test("resident has no report navigation and cannot access report downloads", async ({
    page,
}) => {
    await page.goto("/login");
    await page
        .getByLabel("อีเมล", { exact: true })
        .fill("resident@roomfix.test");
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill("RoomFixDemo!2026");
    await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
        page.getByRole("link", { name: "รายงานงานซ่อม", exact: true }),
    ).toHaveCount(0);
    expect((await page.request.get("/reports")).status()).toBe(403);
    expect((await page.request.get("/reports/export")).status()).toBe(403);
});
