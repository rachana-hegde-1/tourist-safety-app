# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\share_link.spec.ts >> share link opens without login and shows a map
- Location: tests\share_link.spec.ts:3:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/track/some-mock-token", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("share link opens without login and shows a map", async ({ page }) => {
  4  |   // Assuming a share link can be generated and copied from the dashboard
  5  |   // For this test, we'll simulate opening a pre-generated share link.
  6  |   // In a real scenario, you'd generate one in a previous step or mock it.
  7  | 
  8  |   const shareLink = "/track/some-mock-token"; // Replace with a dynamic or mocked link if possible
  9  | 
> 10 |   await page.goto(shareLink);
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  11 | 
  12 |   // Expect no login redirection and map to be visible
  13 |   await expect(page).not.toHaveURL(/login/);
  14 |   await expect(page.locator("iframe[src*=\"maps.google.com\"]")).toBeVisible();
  15 |   await expect(page.locator("text=Live Tracking")).toBeVisible();
  16 | });
```