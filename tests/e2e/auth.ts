import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "กรุณากำหนด INITIAL_ADMIN_EMAIL และ INITIAL_ADMIN_PASSWORD ก่อนรัน e2e test นี้"
    );
  }

  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(email);
  await page.getByLabel("รหัสผ่าน").fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
