import { test, expect } from "@playwright/test";

test("share link opens without login and shows a map", async ({ page }) => {
  // Assuming a share link can be generated and copied from the dashboard
  // For this test, we'll simulate opening a pre-generated share link.
  // In a real scenario, you'd generate one in a previous step or mock it.

  const shareLink = "/track/some-mock-token"; // Replace with a dynamic or mocked link if possible

  await page.goto(shareLink);

  // Expect no login redirection and map to be visible
  await expect(page).not.toHaveURL(/login/);
  await expect(page.locator("iframe[src*=\"maps.google.com\"]")).toBeVisible();
  await expect(page.locator("text=Live Tracking")).toBeVisible();
});