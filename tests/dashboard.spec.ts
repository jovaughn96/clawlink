import { test, expect } from "@playwright/test";

const APP_PASSWORD = "ManageLMTD2026!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="password"]', APP_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

test.describe("Login", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=ClawLink")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("protected API rejects unauthenticated requests", async () => {
    // Use native fetch (no Playwright cookie jar)
    const res = await fetch("http://localhost:3000/api/stats");
    expect(res.status).toBe(401);
  });

  test("logs in with correct password", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });

  test("rejects wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard Overview", () => {
  test("loads stats without getting stuck", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");

    // Should show stat cards (not stay on "Loading stats...")
    await expect(page.locator("text=Loading stats...")).toBeHidden({
      timeout: 15000,
    });

    // Stat cards in the main area should be visible
    await expect(
      page.getByRole("main").locator("text=Connected Devices")
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("main").locator("text=Uptime")
    ).toBeVisible();
  });
});

test.describe("Sessions", () => {
  test("loads session list without getting stuck", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/sessions");

    // Should not stay on loading
    await expect(page.locator("text=Loading sessions...")).toBeHidden({
      timeout: 15000,
    });

    // Should show either sessions or "No sessions found"
    const hasSessions = await page.locator(".grid a").count();
    if (hasSessions === 0) {
      await expect(page.locator("text=No sessions found")).toBeVisible();
    } else {
      await expect(page.locator(".grid a").first()).toBeVisible();
    }
  });
});

test.describe("Chat", () => {
  test("shows chat interface", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/chat");
    await expect(
      page.locator('input[placeholder="Type a message..."]')
    ).toBeVisible();
    await expect(page.locator("text=Send a message to start chatting")).toBeVisible();
  });
});
