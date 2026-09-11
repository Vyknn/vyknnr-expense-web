import { test, expect } from "@playwright/test";

test("homepage renders the round list heading", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "รายการรอบเบิก-จ่าย" })
  ).toBeVisible();
});
