import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test("manage expense categories and clear a deleted category from existing items", async ({
  page,
}) => {
  const suffix = Date.now();
  const categoryName = `ประเภท E2E ${suffix}`;
  const updatedCategoryName = `ประเภทแก้ไข E2E ${suffix}`;
  const roundName = `รอบล้างประเภท E2E ${suffix}`;

  await loginAsAdmin(page);
  await page.goto("/settings/categories");
  await page.getByRole("button", { name: "เพิ่มประเภท" }).click();
  const createDialog = page.getByRole("dialog", {
    name: "เพิ่มประเภทค่าใช้จ่าย",
  });
  await createDialog.getByLabel("ชื่อประเภทค่าใช้จ่าย").fill(categoryName);
  await createDialog.getByRole("button", { name: "บันทึกประเภท" }).click();
  await expect(page.getByRole("cell", { name: categoryName, exact: true })).toBeVisible();

  await page
    .getByRole("button", { name: `แก้ไขประเภท ${categoryName}` })
    .click();
  const editDialog = page.getByRole("dialog", {
    name: "แก้ไขประเภทค่าใช้จ่าย",
  });
  await editDialog
    .getByLabel("ชื่อประเภทค่าใช้จ่าย")
    .fill(updatedCategoryName);
  await editDialog.getByRole("button", { name: "บันทึกการแก้ไข" }).click();
  await expect(
    page.getByRole("cell", { name: updatedCategoryName, exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "เพิ่มประเภท" }).click();
  await createDialog
    .getByLabel("ชื่อประเภทค่าใช้จ่าย")
    .fill(updatedCategoryName);
  await createDialog.getByRole("button", { name: "บันทึกประเภท" }).click();
  await expect(createDialog.getByText("มีประเภทค่าใช้จ่ายนี้แล้ว")).toBeVisible();
  await createDialog.getByRole("button", { name: "ยกเลิก" }).click();

  await page.getByRole("link", { name: "หน้าหลัก" }).click();
  await page.getByRole("button", { name: "สร้างรอบใหม่" }).click();
  await page.getByLabel("ชื่อรอบ").fill(roundName);
  await page.getByRole("button", { name: "สร้างรอบ", exact: true }).click();
  const roundPath = new URL(page.url()).pathname;

  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  const expenseDialog = page.getByRole("dialog", {
    name: "เพิ่มรายการค่าใช้จ่าย",
  });
  await expenseDialog.getByLabel("รายละเอียด").fill("รายการที่ล้างประเภท");
  await expenseDialog
    .getByLabel("ประเภทค่าใช้จ่าย")
    .selectOption({ label: updatedCategoryName });
  await expenseDialog.getByLabel("จำนวนเงิน (บาท)").fill("99");
  await expenseDialog.getByRole("button", { name: "บันทึกรายการ" }).click();
  await expect(
    page.getByText(updatedCategoryName, { exact: true })
  ).toBeVisible();

  await page.goto("/settings/categories");
  await page
    .getByRole("button", { name: `ลบประเภท ${updatedCategoryName}` })
    .click();
  await page.locator(".swal2-confirm").click();
  await expect(
    page.getByText(updatedCategoryName, { exact: true })
  ).toHaveCount(0);

  await page.goto(roundPath);
  await expect(
    page.getByText("รายการที่ล้างประเภท", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("ไม่ระบุประเภท", { exact: true })).toBeVisible();
});

test("delete an unused expense category", async ({ page }) => {
  const categoryName = `ประเภทลบ E2E ${Date.now()}`;

  await loginAsAdmin(page);
  await page.goto("/settings/categories");
  await page.getByRole("button", { name: "เพิ่มประเภท" }).click();
  const dialog = page.getByRole("dialog", {
    name: "เพิ่มประเภทค่าใช้จ่าย",
  });
  await dialog.getByLabel("ชื่อประเภทค่าใช้จ่าย").fill(categoryName);
  await dialog.getByRole("button", { name: "บันทึกประเภท" }).click();

  await page
    .getByRole("button", { name: `ลบประเภท ${categoryName}` })
    .click();
  await page.locator(".swal2-confirm").click();
  await expect(page.getByText(categoryName, { exact: true })).toHaveCount(0);
});
