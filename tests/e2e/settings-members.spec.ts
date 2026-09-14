import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test("admin creates a member, edits their role, and toggles their status", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const suffix = Date.now();
  const displayName = `สมาชิก E2E ${suffix}`;
  const email = `member-e2e-${suffix}@example.com`;

  await page.goto("/settings/members");
  await page.getByRole("button", { name: "เพิ่มสมาชิก" }).click();

  const createDialog = page.getByRole("dialog", { name: "เพิ่มสมาชิกใหม่" });
  await createDialog.getByLabel("ชื่อสมาชิก").fill(displayName);
  await createDialog.getByLabel("อีเมล").fill(email);
  await createDialog
    .getByLabel("สิทธิ์การใช้งาน")
    .selectOption({ label: "ผู้ดูข้อมูล" });
  await createDialog.getByLabel(/รหัสผ่านชั่วคราว/).fill("temporary-pass-123");
  await createDialog.getByRole("button", { name: "บันทึกสมาชิก" }).click();
  await expect(createDialog.getByText("สร้างสมาชิกสำเร็จ")).toBeVisible();
  await createDialog.getByRole("button", { name: "ปิด" }).click();
  await expect(page.getByText(displayName, { exact: true })).toBeVisible();

  await page
    .getByRole("button", { name: `แก้ไขสิทธิ์ของ ${displayName}` })
    .click();
  const editDialog = page.getByRole("dialog", {
    name: `แก้ไขสิทธิ์ของ ${displayName}`,
  });
  await editDialog
    .getByLabel("สิทธิ์การใช้งาน")
    .selectOption({ label: "ผู้แก้ไข" });
  await editDialog.getByRole("button", { name: "บันทึกสิทธิ์" }).click();
  await expect(editDialog).toBeHidden();

  const row = page.locator("tr", { hasText: email });
  await expect(row.getByText("ผู้แก้ไข")).toBeVisible();

  const toggle = page.getByRole("switch", {
    name: `ปิดใช้งานบัญชี ${displayName}`,
  });
  await toggle.click();
  await expect(
    page.getByRole("switch", { name: `เปิดใช้งานบัญชี ${displayName}` })
  ).toBeVisible();
});

test("an admin cannot edit their own role or disable their own account", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/settings/members");

  const ownRow = page.locator("tr", { hasText: process.env.INITIAL_ADMIN_EMAIL! });
  await expect(ownRow.getByRole("button", { name: /แก้ไขสิทธิ์ของ/ })).toHaveCount(0);
  await expect(ownRow.getByRole("switch")).toBeDisabled();
});
