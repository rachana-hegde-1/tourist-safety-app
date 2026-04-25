# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth.spec.ts >> tourist can sign up and complete onboarding
- Location: tests\auth.spec.ts:3:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/signup", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("tourist can sign up and complete onboarding", async ({ page }) => {
> 4  |   await page.goto("/signup");
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  5  | 
  6  |   await page.fill("input[name=\"name\"]", "Test Tourist");
  7  |   await page.fill("input[name=\"email\"]", `test${Date.now()}@example.com`);
  8  |   await page.fill("input[name=\"password\"]", "password123");
  9  |   await page.click("button[type=\"submit\"]");
  10 | 
  11 |   await expect(page).toHaveURL("/onboarding");
  12 | 
  13 |   await page.fill("input[name=\"emergencyName1\"]", "Emergency Contact 1");
  14 |   await page.fill("input[name=\"emergencyPhone1\"]", "+11234567890");
  15 |   await page.fill("input[name=\"emergencyName2\"]", "Emergency Contact 2");
  16 |   await page.fill("input[name=\"emergencyPhone2\"]", "+10987654321");
  17 |   await page.click("button[type=\"submit\"]");
  18 | 
  19 |   await expect(page).toHaveURL("/dashboard");
  20 |   await expect(page.locator("text=Welcome, Test Tourist!")).toBeVisible();
  21 | });
```