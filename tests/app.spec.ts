import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hgsqjblooygtcmxknkhs.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnc3FqYmxvb3lndGNteGtua2hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4MzAyNywiZXhwIjoyMDkwODU5MDI3fQ.3wQev3fXBe-_AuwD9demvzTQTKIfSwsb_qmyWOQc2C4";

const TEST_EMAIL = `test-${Date.now()}@tailwinds.dev`;
const TEST_PASSWORD = "TestPass123!";
const TEST_NAME = "Test Pilot";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let testUserId: string;

// Helper: sign in via the UI
async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

test.describe.serial("Tailwinds E2E", () => {
  test.beforeAll(async () => {
    // Create test user via admin API (bypass email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: TEST_NAME },
    });
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    testUserId = data.user.id;
  });

  test.afterAll(async () => {
    // Clean up: delete flights, aircraft, profile, then auth user
    if (testUserId) {
      await supabase.from("flights").delete().eq("pilot_id", testUserId);
      await supabase.from("aircraft").delete().eq("owner_id", testUserId);
      await supabase.from("profiles").delete().eq("id", testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test("1. Sign in and redirect to dashboard", async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);
    // New user with no aircraft should see the setup prompt
    await expect(page.getByText("Welcome to Tailwinds")).toBeVisible();
    await expect(page.getByText("Add your aircraft to get started")).toBeVisible({ timeout: 5000 });
  });

  test("2. Add an aircraft", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/aircraft/new");
    await expect(page.getByText("Add Aircraft")).toBeVisible();

    await page.getByLabel("Tail Number").fill("N-TEST1");
    await page.getByLabel("Make / Model").fill("Cessna 172S");
    await page.getByLabel("Year").fill("2004");
    await page.getByLabel("Home Airport").fill("KSNA");
    await page.getByLabel("Current Hobbs").fill("1000.0");
    await page.getByLabel("Current Tach").fill("950.0");
    await page.getByRole("button", { name: "Save Aircraft" }).click();

    // Should redirect to aircraft list
    await page.waitForURL("**/dashboard/aircraft", { timeout: 10000 });
    await expect(page.getByText("N-TEST1")).toBeVisible();
  });

  test("3. Verify aircraft appears in list", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/aircraft");
    await expect(page.getByText("N-TEST1")).toBeVisible();
    await expect(page.getByText("Cessna 172S")).toBeVisible();
    await expect(page.getByText("KSNA")).toBeVisible();
  });

  test("4. Log a flight", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/logbook/new");
    await expect(page.getByText("Log a Flight")).toBeVisible();

    // Aircraft should be auto-selected (only one)
    // Hobbs start should auto-fill from aircraft
    const hobbsStart = page.locator("#hobbsStart");
    // Browser number inputs strip trailing zeros: 1000.0 → "1000"
    await expect(hobbsStart).toHaveValue(/^1000(\.0)?$/);

    // Fill route
    await page.locator("#routeFrom").fill("KSNA");
    await page.locator("#routeTo").fill("KSBA");

    // Fill hobbs end
    await page.locator("#hobbsEnd").fill("1001.2");

    // Total time should auto-compute
    const totalTime = page.locator('input[name="totalTime"]');
    await expect(totalTime).toHaveValue("1.2");

    // Fill tach
    await page.locator("#tachEnd").fill("951.0");

    // Day landings should default to 1
    const landingsDay = page.locator("#landingsDay");
    await expect(landingsDay).toHaveValue("1");

    // Submit
    await page.getByRole("button", { name: "Log Flight" }).click();
    await page.waitForURL("**/dashboard/logbook", { timeout: 10000 });
  });

  test("5. Verify flight appears in logbook", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/logbook");
    await expect(page.getByText("KSNA")).toBeVisible();
    await expect(page.getByText("KSBA")).toBeVisible();
    // Total time 1.2 should appear (may appear in stats card and flight row)
    await expect(page.getByText("1.2").first()).toBeVisible();
  });

  test("6. Verify aircraft Hobbs updated to 1001.2", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/aircraft");
    // Click on the aircraft card to view details
    await page.getByText("N-TEST1").click();
    await page.waitForURL("**/dashboard/aircraft/**");
    // Hobbs should show 1001.2
    await expect(page.getByText("1001.2")).toBeVisible();
  });

  test("7. Dashboard shows correct quick stats", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard");
    // Should show "Dashboard" heading now that aircraft exists
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Quick stats: total hours = 1.2, flights this month = 1
    await expect(page.getByText("1.2").first()).toBeVisible();
  });

  test("8. Currency cards render on dashboard", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard");
    // Currency section should be visible
    await expect(page.getByText("Currency Status")).toBeVisible();
    await expect(page.getByText("Night Currency")).toBeVisible();
    await expect(page.getByText("IFR Currency")).toBeVisible();
    await expect(page.getByText("Flight Review")).toBeVisible();
    await expect(page.getByText("Medical")).toBeVisible();
  });

  test("9. Export CSV downloads a file", async ({ page, request }) => {
    await signIn(page);

    // Grab cookies from the authenticated page context for the API request
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/export", {
      headers: { Cookie: cookieHeader },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["content-disposition"]).toContain("tailwinds-logbook");

    const content = await response.text();
    expect(content).toContain("Date");
    expect(content).toContain("Aircraft");
    expect(content).toContain("N-TEST1");
    expect(content).toContain("KSNA");
    expect(content).toContain("KSBA");
    expect(content).toContain("TOTALS");
  });

  test("10. Flight entry form works at 390px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.goto("/dashboard/logbook/new");

    // Form should be visible and usable
    await expect(page.locator("#routeFrom")).toBeVisible();
    await expect(page.locator("#routeTo")).toBeVisible();
    await expect(page.locator("#hobbsStart")).toBeVisible();
    await expect(page.locator("#hobbsEnd")).toBeVisible();

    // Details section should be collapsed
    await expect(page.getByLabel("Night Time")).not.toBeVisible();

    // Click Details to expand
    await page.getByText("Details").click();
    await expect(page.getByLabel("Night Time")).toBeVisible();

    // Fuel section should be collapsed
    await expect(page.getByLabel("Gallons")).not.toBeVisible();
    await page.getByText("Fuel").click();
    await expect(page.getByLabel("Gallons")).toBeVisible();

    // Cancel button should be visible
    await expect(page.getByText("Cancel")).toBeVisible();
  });
});
