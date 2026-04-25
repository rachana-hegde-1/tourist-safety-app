# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\panic.spec.ts >> panic button creates an alert that appears in admin dashboard
- Location: tests\panic.spec.ts:3:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/dashboard", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("panic button creates an alert that appears in admin dashboard", async ({ page }) => {
  4  |   // Assuming a logged-in tourist session
> 5  |   await page.goto("/dashboard");
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  6  | 
  7  |   await page.click("button:has-text(\"Open panic button\")");
  8  |   await page.click("button:has-text(\"Send SOS Alert\")");
  9  | 
  10 |   // Verify toast message
  11 |   await expect(page.locator("div[data-sonner-toast]")).toContainText("Panic alert sent!");
  12 | 
  13 |   // Assuming admin dashboard is at /admin
  14 |   await page.goto("/admin"); // This might require a separate login or session setup for admin
  15 | 
  16 |   // Check for the panic alert in the admin dashboard
  17 |   await expect(page.locator("text=PANIC")).toBeVisible();
  18 | });
```