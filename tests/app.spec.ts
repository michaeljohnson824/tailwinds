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
    // Clean up: delete all user data then auth user
    if (testUserId) {
      // Get aircraft IDs for FK cleanup
      const { data: aircraftRows } = await supabase
        .from("aircraft")
        .select("id")
        .eq("owner_id", testUserId);
      const aircraftIds = (aircraftRows ?? []).map((a) => a.id);

      if (aircraftIds.length > 0) {
        await supabase.from("engines").delete().in("aircraft_id", aircraftIds);
        await supabase.from("cost_profiles").delete().in("aircraft_id", aircraftIds);
        await supabase.from("expenses").delete().in("aircraft_id", aircraftIds);
      }
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

  // ============================================================
  // Layer 2 Tests
  // ============================================================

  test("11. Add engine to aircraft and verify status displays", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/aircraft");
    await page.getByText("N-TEST1").click();
    await page.waitForURL("**/dashboard/aircraft/**");

    // Free user sees teaser for engine section — upgrade link
    // For testing, set user to pilot tier so we can test engine features
    await supabase
      .from("profiles")
      .update({ subscription_tier: "pilot" })
      .eq("id", testUserId);

    // Reload to pick up tier change
    await page.reload();

    // Should see "Set Up Engine" button
    await expect(page.getByRole("button", { name: "Set Up Engine" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Set Up Engine" }).click();

    // Fill engine form
    await page.getByLabel("Engine Make / Model").fill("Lycoming IO-360-L2A");
    await page.getByLabel("TBO (hours)").fill("2000");
    await page.getByLabel("TSMOH (hours)").fill("500");
    await page.getByLabel("Estimated Overhaul Cost ($)").fill("40000");
    await page.getByLabel("Last Oil Change (tach)").fill("945.0");
    await page.getByLabel("Oil Change Interval (hrs)").fill("50");

    await page.getByRole("button", { name: "Save Engine" }).click();

    // Wait for page to refresh and show engine status
    await expect(page.getByText("Lycoming IO-360-L2A")).toBeVisible({ timeout: 10000 });

    // Engine status should display TBO progress
    await expect(page.getByText("Time to Overhaul")).toBeVisible();
    await expect(page.getByText("1500.0 hrs remaining")).toBeVisible();

    // Oil change status
    await expect(page.getByText("Oil Change", { exact: true })).toBeVisible();

    // Reserve rate: $40000 / 2000 = $20.00/hr
    await expect(page.getByText("$20.00/hr").first()).toBeVisible();
  });

  test("12. Set up cost profile with correct totals", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/aircraft");
    await page.getByText("N-TEST1").click();
    await page.waitForURL("**/dashboard/aircraft/**");

    // Click "Set Up Cost Tracking"
    await expect(page.getByText("Set Up Cost Tracking")).toBeVisible({ timeout: 5000 });
    await page.getByText("Set Up Cost Tracking").click();
    await page.waitForURL("**/costs");

    // Step 1: Fixed costs
    await expect(page.getByText("Step 1: Fixed Costs")).toBeVisible();

    await page.getByLabel("Monthly Hangar / Tiedown").fill("400");
    await page.getByLabel("Annual Insurance").fill("2400");
    await page.getByLabel("Annual Inspection Estimate").fill("1200");
    await page.getByLabel("Monthly Loan / Financing").fill("300");
    await page.getByLabel("Monthly Subscriptions").fill("50");

    // Verify monthly total: 400 + 2400/12 + 1200/12 + 300 + 50 = 400+200+100+300+50 = 1050
    await expect(page.getByText("$1050/mo")).toBeVisible();

    // Verify annual total: 1050 * 12 = 12600
    await expect(page.getByText("$12600/yr")).toBeVisible();

    // Continue to step 2
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2: Confirmation
    await expect(page.getByText("Step 2: Confirm")).toBeVisible();
    await expect(page.getByText("$12600/yr")).toBeVisible();

    // Save
    await page.getByRole("button", { name: "Save Cost Profile" }).click();
    // Should redirect back to aircraft detail
    await page.waitForURL("**/dashboard/aircraft/**", { timeout: 10000 });

    // Should now show "Edit Cost Profile" instead of "Set Up"
    await expect(page.getByText("Edit Cost Profile")).toBeVisible();
    await expect(page.getByText("$1050/mo in fixed costs")).toBeVisible();
  });

  test("13. Add expense manually and verify it appears", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/expenses");

    await expect(page.getByRole("heading", { name: "Expenses" })).toBeVisible();

    // Click Add Expense
    await page.getByRole("button", { name: "Add Expense" }).click();

    // Fill expense form
    // Aircraft should be pre-selected (only one)
    await page.locator("select[name='category']").selectOption("maintenance");
    await page.getByLabel("Amount ($)").fill("250");
    await page.getByLabel("Description").fill("Oil change and filter");

    await page.getByRole("button", { name: "Add Expense" }).click();

    // Expense should appear in the list
    await expect(page.getByText("Oil change and filter")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("span").filter({ hasText: "$250.00" })).toBeVisible();
    // Category badge should show in the expense row (not in form select)
    await expect(page.locator("span").filter({ hasText: "Maintenance" }).first()).toBeVisible();
  });

  test("14. Log flight with fuel data and verify auto fuel expense", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/logbook/new");

    // Fill flight form
    await page.locator("#routeFrom").fill("KSBA");
    await page.locator("#routeTo").fill("KSNA");
    await page.locator("#hobbsEnd").fill("1002.5");
    await page.locator("#tachEnd").fill("952.2");

    // Expand Fuel section and fill
    await page.getByText("Fuel").click();
    await page.getByLabel("Gallons").fill("12.5");
    await page.getByLabel("Price/gal ($)").fill("6.50");

    await page.getByRole("button", { name: "Log Flight" }).click();
    await page.waitForURL("**/dashboard/logbook", { timeout: 10000 });

    // Now check expenses — a fuel expense should have been auto-created
    await page.goto("/dashboard/expenses");
    await expect(page.getByText(/Fuel — KSBA to KSNA/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("$81.25")).toBeVisible(); // 12.5 * 6.50
  });

  test("15. Cost dashboard shows cost per hour and breakdown cards", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/costs");

    // Should see the big cost per hour number (not the paywall since user is pilot tier)
    await expect(page.getByText("Your Cost Per Hour")).toBeVisible({ timeout: 10000 });

    // The number should be a dollar amount — at least check for the $ sign
    await expect(page.locator("text=/\\$\\d+\\.\\d{2}/").first()).toBeVisible();

    // Breakdown cards should be visible
    await expect(page.getByText("Fixed Costs").first()).toBeVisible();
    await expect(page.getByText("Fuel").first()).toBeVisible();
    await expect(page.getByText("Maintenance").first()).toBeVisible();
    await expect(page.getByText("Engine Reserve")).toBeVisible();

    // Each card should show a /hr value
    const perHrLabels = page.locator("text=/\\/hr/");
    await expect(perHrLabels.first()).toBeVisible();
  });

  test("16. Cost dashboard charts render without errors", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/costs");

    // Wait for page to load
    await expect(page.getByText("Your Cost Per Hour")).toBeVisible({ timeout: 10000 });

    // Trend chart section should render
    await expect(page.getByText("Cost Per Hour — Trailing 12 Months")).toBeVisible();

    // Recharts renders SVG elements inside responsive containers
    const chartSvg = page.locator(".recharts-wrapper").first();
    await expect(chartSvg).toBeVisible({ timeout: 10000 });

    // Pie chart section
    await expect(page.getByText("Cost Breakdown by Category")).toBeVisible();

    // Utilization insight
    await expect(page.getByText("Utilization Insight")).toBeVisible();
    await expect(page.getByText(/You flew .+ hours/)).toBeVisible();

    // Expense summary table
    await expect(page.getByText("Expense Summary")).toBeVisible();
  });

  test("17. Free user sees paywall on /dashboard/costs", async ({ page }) => {
    // Reset user to free tier
    await supabase
      .from("profiles")
      .update({ subscription_tier: "free" })
      .eq("id", testUserId);

    await signIn(page);
    await page.goto("/dashboard/costs");

    // Should see paywall modal, not the dashboard
    await expect(page.getByText("Unlock Cost Tracking")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("$9")).toBeVisible();
    await expect(page.getByText("$89")).toBeVisible();
    await expect(page.getByText("save 18%")).toBeVisible();

    // Should NOT see the cost per hour number
    await expect(page.getByText("Your Cost Per Hour")).not.toBeVisible();

    // Restore pilot tier for subsequent tests
    await supabase
      .from("profiles")
      .update({ subscription_tier: "pilot" })
      .eq("id", testUserId);
  });

  test("18. Dashboard teaser card renders with flight data", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard");

    // With cost profile and flight data, should show cost per hour teaser
    // Should see either a dollar cost/hr value or "Cost Per Hour" text
    await expect(page.getByText("Cost Per Hour")).toBeVisible({ timeout: 10000 });

    // The teaser card links to the costs dashboard (scope to main content, not sidebar)
    const teaserLink = page.locator("main a[href='/dashboard/costs']");
    await expect(teaserLink).toBeVisible();
  });
});
