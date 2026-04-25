import { test, expect } from "@playwright/test";

test("invalid tracking link shows error message", async ({ page }) => {
  // Mock the API response to reliably test the frontend logic
  // even if the live Vercel backend is returning 500s or timeouts.
  await page.route("**/api/track/*/location", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, reason: "invalid_token" }),
    });
  });

  await page.goto("/track/invalid-token");
  
  // Wait for the exact heading to be visible
  await expect(page.locator("text=Invalid tracking link")).toBeVisible();
});