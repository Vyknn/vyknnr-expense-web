import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

// 1x1 transparent PNG, used as fake receipt uploads.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test("create a round, add an expense item with multiple receipts, and view them in the gallery", async ({
  page,
}) => {
  const roundName = `E2E รอบทดสอบ ${Date.now()}`;

  await loginAsAdmin(page);

  await page.getByRole("button", { name: "สร้างรอบใหม่" }).click();
  await page.getByLabel("ชื่อรอบ").fill(roundName);
  await page.getByRole("button", { name: "สร้างรอบ", exact: true }).click();

  await expect(page.getByRole("heading", { name: roundName })).toBeVisible();

  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  await page.getByLabel("รายละเอียด").fill("ซื้อกระดาษ A4");
  await page.getByLabel("ประเภทค่าใช้จ่าย").selectOption({ label: "อาหาร" });
  await page.getByLabel("จำนวนเงิน (บาท)").fill("120.50");
  await page.locator('input[name="receipts"]').setInputFiles([
    {
      name: "receipt-1.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_BASE64, "base64"),
    },
    {
      name: "receipt-2.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_BASE64, "base64"),
    },
  ]);
  await page.getByRole("button", { name: "บันทึกรายการ" }).click();

  await expect(page.getByRole("cell", { name: "ซื้อกระดาษ A4" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "อาหาร", exact: true })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "ไม่ระบุผู้จ่าย", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "฿120.50" })).toBeVisible();

  await page.getByRole("button", { name: "หลักฐาน (2)" }).click();
  const galleryDialog = page.getByRole("dialog", { name: "หลักฐาน (2)" });
  await expect(galleryDialog).toBeVisible();

  const thumbnails = galleryDialog.locator("img");
  await expect(thumbnails).toHaveCount(2);

  // Clicking a thumbnail opens the full-image lightbox, not a new tab.
  await thumbnails.first().click();
  const lightbox = page.getByRole("dialog", { name: "ดูรูปหลักฐานแบบเต็ม" });
  await expect(lightbox).toBeVisible();

  const lightboxImageSrc = await lightbox.locator("img").getAttribute("src");
  expect(lightboxImageSrc).toBeTruthy();

  const receiptResponse = await page.request.get(lightboxImageSrc!);
  expect(receiptResponse.status()).toBe(200);
  expect(receiptResponse.headers()["content-type"]).toBe("image/jpeg");

  await lightbox.getByRole("button", { name: "ปิดรูปเต็ม" }).click();
  await expect(lightbox).toBeHidden();

  await galleryDialog.getByRole("button", { name: "ปิดหน้าต่าง" }).click();

  // Edit the item and verify the change is reflected. Both the mobile-card and
  // desktop-table variants render their own <dialog> in the DOM regardless of which
  // is visually hidden, so scope to the currently open dialog to avoid ambiguity.
  await page.getByRole("button", { name: "แก้ไขรายการนี้" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("รายละเอียด").fill("ซื้อกระดาษ A4 (แก้ไขแล้ว)");
  await editDialog.getByLabel("ประเภทค่าใช้จ่าย").selectOption({ label: "อุปกรณ์" });
  await editDialog.getByLabel("จำนวนเงิน (บาท)").fill("199.00");
  await editDialog.getByRole("button", { name: "บันทึกการแก้ไข" }).click();

  await expect(
    page.getByRole("cell", { name: "ซื้อกระดาษ A4 (แก้ไขแล้ว)" })
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "฿199.00" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "อุปกรณ์", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "รายการเบิก" }).click();
  await expect(page).toHaveURL(/\/rounds\/\d+\/summary$/);
  await expect(page.getByText("รายการเบิก", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "ซื้อกระดาษ A4 (แก้ไขแล้ว)" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "หลักฐาน (2)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "พิมพ์รายการเบิก" })).toBeVisible();
  await expect(page.getByText("฿199.00", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "กลับรายละเอียดรอบ" }).click();
  await expect(page.getByRole("heading", { name: roundName })).toBeVisible();

  // Delete the round from the detail page and confirm it redirects home and disappears.
  await page.getByRole("button", { name: `ลบรอบ ${roundName}` }).click();
  await page.locator(".swal2-confirm").click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(roundName)).toHaveCount(0);
});

test("edit a round's name, note, and status", async ({ page }) => {
  const originalName = `E2E แก้ไขรอบ ${Date.now()}`;
  const updatedName = `${originalName} ใหม่`;
  const updatedNote = "หมายเหตุที่แก้ไขแล้ว";

  await loginAsAdmin(page);
  await page.getByRole("button", { name: "สร้างรอบใหม่" }).click();
  await page.getByLabel("ชื่อรอบ").fill(originalName);
  await page.getByRole("button", { name: "สร้างรอบ", exact: true }).click();

  await page.getByRole("button", { name: "แก้ไข" }).click();
  const dialog = page.getByRole("dialog", { name: "แก้ไขรายละเอียดรอบ" });
  await dialog.getByLabel("ชื่อรอบ").fill(updatedName);
  await dialog.getByLabel("หมายเหตุ (ถ้ามี)").fill(updatedNote);
  await dialog.getByLabel("สถานะ").selectOption("completed");
  await dialog.getByRole("button", { name: "บันทึกการแก้ไข" }).click();

  await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();
  await expect(page.getByText(updatedNote, { exact: true })).toBeVisible();
  await expect(page.getByText("เสร็จสิ้น", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "สถานะรอบ" })
  ).toHaveCount(0);

  await page.getByRole("link", { name: "กลับหน้ารายการรอบ" }).click();
  await expect(page.getByRole("link", { name: updatedName })).toBeVisible();

  await page.getByRole("button", { name: `ลบรอบ ${updatedName}` }).click();
  await page.locator(".swal2-confirm").click();
});

test("delete a round directly from the round list", async ({ page }) => {
  const roundName = `E2E ลบจาก list ${Date.now()}`;

  await loginAsAdmin(page);
  await page.getByRole("button", { name: "สร้างรอบใหม่" }).click();
  await page.getByLabel("ชื่อรอบ").fill(roundName);
  await page.getByRole("button", { name: "สร้างรอบ", exact: true }).click();
  await expect(page.getByRole("heading", { name: roundName })).toBeVisible();

  await page.getByRole("link", { name: "กลับหน้ารายการรอบ" }).click();
  await expect(page.getByRole("link", { name: roundName })).toBeVisible();

  await page.getByRole("button", { name: `ลบรอบ ${roundName}` }).click();
  await page.locator(".swal2-confirm").click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: roundName })).toHaveCount(0);
});

test("a new round defaults to in-progress status and its status can be changed", async ({
  page,
}) => {
  const roundName = `E2E สถานะ ${Date.now()}`;

  await loginAsAdmin(page);
  await page.getByRole("button", { name: "สร้างรอบใหม่" }).click();
  await page.getByLabel("ชื่อรอบ").fill(roundName);
  await page.getByRole("button", { name: "สร้างรอบ", exact: true }).click();
  await expect(page.getByRole("heading", { name: roundName })).toBeVisible();

  await expect(page.getByText("ดำเนินการ", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "สถานะรอบ" })
  ).toHaveCount(0);

  await page.getByRole("button", { name: "แก้ไข" }).click();
  const dialog = page.getByRole("dialog", { name: "แก้ไขรายละเอียดรอบ" });
  await dialog.getByLabel("สถานะ").selectOption("completed");
  await dialog.getByRole("button", { name: "บันทึกการแก้ไข" }).click();
  await expect(page.getByText("เสร็จสิ้น", { exact: true })).toBeVisible();

  // Reflected back on the round list too.
  await page.getByRole("link", { name: "กลับหน้ารายการรอบ" }).click();
  const listRow = page.getByRole("row", { name: new RegExp(roundName) });
  await expect(listRow.getByText("เสร็จสิ้น", { exact: true })).toBeVisible();
  await expect(
    listRow.getByRole("combobox", { name: "สถานะรอบ" })
  ).toHaveCount(0);

  await listRow.getByRole("button", { name: `ลบรอบ ${roundName}` }).click();
  await page.locator(".swal2-confirm").click();
  await expect(page.getByRole("link", { name: roundName })).toHaveCount(0);
});
