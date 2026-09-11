import { test, expect } from "@playwright/test";

test("homepage renders the getting-started heading", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/page\.tsx/i)).toBeVisible();
});
