import { test, expect } from "@playwright/test";

test.skip("tourist can sign up and complete onboarding", async ({ page }) => {
  await page.goto("/sign-up");

  await page.fill("input[name=\"name\"]", "Test Tourist");
  await page.fill("input[name=\"email\"]", `test${Date.now()}@example.com`);
  await page.fill("input[name=\"password\"]", "password123");
  await page.click("button[type=\"submit\"]");

  await expect(page).toHaveURL("/onboarding");

  await page.fill("input[name=\"emergencyName1\"]", "Emergency Contact 1");
  await page.fill("input[name=\"emergencyPhone1\"]", "+11234567890");
  await page.fill("input[name=\"emergencyName2\"]", "Emergency Contact 2");
  await page.fill("input[name=\"emergencyPhone2\"]", "+10987654321");
  await page.click("button[type=\"submit\"]");

  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator("text=Welcome, Test Tourist!")).toBeVisible();
});