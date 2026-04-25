import { test, expect } from "@playwright/test";

test("wearable simulator ping updates the tourist location on map", async ({ page }) => {
  // Assuming a logged-in tourist session
  await page.goto("/dashboard");

  // Get initial map center (this might be tricky without direct access to map object)
  // For now, we'll assume the map is rendered and will look for a change after ping.
  const initialMapSrc = await page.locator("iframe[src*=\"maps.google.com\"]").getAttribute("src");
  expect(initialMapSrc).not.toBeNull();

  // Simulate a wearable ping (this would typically be an API call or websocket event)
  // For the test, we can mock the API call that the wearable simulator would make.
  await page.evaluate(async () => {
    await fetch("/api/wearable-ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: 13.00, // New location
        longitude: 77.00, // New location
        accuracy: 10,
      }),
    });
  });

  // Wait for the map to update. This might require a more robust wait condition
  // depending on how the map updates (e.g., waiting for a specific network request,
  // or checking for a change in the map's rendered content).
  await page.waitForTimeout(5000); // Wait for 5 seconds for map to re-render

  const updatedMapSrc = await page.locator("iframe[src*=\"maps.google.com\"]").getAttribute("src");
  expect(updatedMapSrc).not.toBeNull();
  expect(updatedMapSrc).not.toEqual(initialMapSrc); // Expect the map URL to have changed
  expect(updatedMapSrc).toContain("q=13.00,77.00"); // Verify new coordinates
});