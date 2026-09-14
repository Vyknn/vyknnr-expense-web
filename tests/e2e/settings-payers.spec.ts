import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test("manage payers and clear a deleted payer from existing expense items", async ({
  page,
}) => {
  const suffix = Date.now();
  const payerName = `ผู้จ่าย E2E ${suffix}`;
  const updatedPayerName = `ผู้จ่ายแก้ไข E2E ${suffix}`;
  const roundName = `รอบล้างผู้จ่าย E2E ${suffix}`;

  await loginAsAdmin(page);
  await page.getByRole("link", { name: "ตั้งค่า" }).click();
  await expect(page).toHaveURL("/settings");

  await page.getByRole("button", { name: "เพิ่มผู้จ่าย" }).click();
  const createDialog = page.getByRole("dialog", { name: "เพิ่มผู้จ่าย/ผู้สำรอง" });
  await createDialog.getByLabel("ชื่อผู้จ่าย/ผู้สำรอง").fill(payerName);
  await createDialog.getByRole("button", { name: "บันทึกผู้จ่าย" }).click();
  await expect(page.getByText(payerName, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `แก้ไขผู้จ่าย ${payerName}` }).click();
  const editDialog = page.getByRole("dialog", { name: "แก้ไขผู้จ่าย/ผู้สำรอง" });
  await editDialog
    .getByLabel("ชื่อผู้จ่าย/ผู้สำรอง")
    .fill(updatedPayerName);
  await editDialog.getByRole("button", { name: "บันทึกการแก้ไข" }).click();
  await expect(page.getByText(updatedPayerName, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "เพิ่มผู้จ่าย" }).click();
  await createDialog.getByLabel("ชื่อผู้จ่าย/ผู้สำรอง").fill(updatedPayerName);
  await createDialog.getByRole("button", { name: "บันทึกผู้จ่าย" }).click();
  await expect(createDialog.getByText("มีชื่อผู้จ่าย/ผู้สำรองนี้แล้ว")).toBeVisible();
  await createDialog.getByRole("button", { name: "ยกเลิก" }).click();

  await page.getByRole("link", { name: "หน้าหลัก" }).click();
  await page.getByRole("button", { name: "สร้างรอบใหม่" }).click();
  await page.getByLabel("ชื่อรอบ").fill(roundName);
  await page.getByRole("button", { name: "สร้างรอบ", exact: true }).click();
  const roundPath = new URL(page.url()).pathname;

  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  const expenseDialog = page.getByRole("dialog", { name: "เพิ่มรายการค่าใช้จ่าย" });
  await expenseDialog.getByLabel("รายละเอียด").fill("รายการที่ล้างผู้จ่าย");
  await expenseDialog
    .getByLabel("ผู้จ่าย/ผู้สำรอง")
    .selectOption({ label: updatedPayerName });
  await expenseDialog.getByLabel("จำนวนเงิน (บาท)").fill("99");
  await expenseDialog.getByRole("button", { name: "บันทึกรายการ" }).click();
  await expect(page.getByText(updatedPayerName, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "ตั้งค่า" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: `ลบผู้จ่าย ${updatedPayerName}` })
    .click();
  await expect(page.getByText(updatedPayerName, { exact: true })).toHaveCount(0);

  await page.goto(roundPath);
  await expect(page.getByText("รายการที่ล้างผู้จ่าย", { exact: true })).toBeVisible();
  await expect(page.getByText("ไม่ระบุผู้จ่าย", { exact: true })).toBeVisible();
});

test("delete an unused payer", async ({ page }) => {
  const payerName = `ผู้จ่ายลบ E2E ${Date.now()}`;

  await loginAsAdmin(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: "เพิ่มผู้จ่าย" }).click();
  const dialog = page.getByRole("dialog", { name: "เพิ่มผู้จ่าย/ผู้สำรอง" });
  await dialog.getByLabel("ชื่อผู้จ่าย/ผู้สำรอง").fill(payerName);
  await dialog.getByRole("button", { name: "บันทึกผู้จ่าย" }).click();

  page.once("dialog", (confirmDialog) => confirmDialog.accept());
  await page.getByRole("button", { name: `ลบผู้จ่าย ${payerName}` }).click();
  await expect(page.getByText(payerName, { exact: true })).toHaveCount(0);
});
