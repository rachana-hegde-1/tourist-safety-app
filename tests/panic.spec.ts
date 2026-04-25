import { test, expect } from "@playwright/test";

test("dashboard redirects to /sign-in when not logged in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/sign-in/);
});