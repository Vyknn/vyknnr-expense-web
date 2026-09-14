import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test("homepage renders the round list heading", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(
    page.getByRole("heading", { name: "รายการรอบเบิก-จ่าย" })
  ).toBeVisible();
});
