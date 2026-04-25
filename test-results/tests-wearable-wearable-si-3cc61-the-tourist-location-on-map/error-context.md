# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\wearable.spec.ts >> wearable simulator ping updates the tourist location on map
- Location: tests\wearable.spec.ts:3:5

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
  3  | test("wearable simulator ping updates the tourist location on map", async ({ page }) => {
  4  |   // Assuming a logged-in tourist session
> 5  |   await page.goto("/dashboard");
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  6  | 
  7  |   // Get initial map center (this might be tricky without direct access to map object)
  8  |   // For now, we'll assume the map is rendered and will look for a change after ping.
  9  |   const initialMapSrc = await page.locator("iframe[src*=\"maps.google.com\"]").getAttribute("src");
  10 |   expect(initialMapSrc).not.toBeNull();
  11 | 
  12 |   // Simulate a wearable ping (this would typically be an API call or websocket event)
  13 |   // For the test, we can mock the API call that the wearable simulator would make.
  14 |   await page.evaluate(async () => {
  15 |     await fetch("/api/wearable-ping", {
  16 |       method: "POST",
  17 |       headers: { "Content-Type": "application/json" },
  18 |       body: JSON.stringify({
  19 |         latitude: 13.00, // New location
  20 |         longitude: 77.00, // New location
  21 |         accuracy: 10,
  22 |       }),
  23 |     });
  24 |   });
  25 | 
  26 |   // Wait for the map to update. This might require a more robust wait condition
  27 |   // depending on how the map updates (e.g., waiting for a specific network request,
  28 |   // or checking for a change in the map's rendered content).
  29 |   await page.waitForTimeout(5000); // Wait for 5 seconds for map to re-render
  30 | 
  31 |   const updatedMapSrc = await page.locator("iframe[src*=\"maps.google.com\"]").getAttribute("src");
  32 |   expect(updatedMapSrc).not.toBeNull();
  33 |   expect(updatedMapSrc).not.toEqual(initialMapSrc); // Expect the map URL to have changed
  34 |   expect(updatedMapSrc).toContain("q=13.00,77.00"); // Verify new coordinates
  35 | });
```