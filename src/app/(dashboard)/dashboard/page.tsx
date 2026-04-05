import type { Metadata } from "next";
import Link from "next/link";
import { getUserAircraft } from "@/lib/queries/aircraft";
import { getCurrencyStatus } from "@/lib/queries/currencies";
import { getFlightStats, getRecentFlights } from "@/lib/queries/stats";
import { getCostProfile } from "@/lib/queries/cost-profiles";
import { getTrailing12MonthExpenses, getMonthlyFlightHours } from "@/lib/queries/expenses";
import { calculateCostPerHour } from "@/lib/utils/costs";
import { Button } from "@/components/ui/button";
import { CurrencyGrid } from "@/components/dashboard/currency-grid";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { RecentFlights } from "@/components/dashboard/recent-flights";
import { CostTeaser } from "@/components/dashboard/cost-teaser";

export const metadata: Metadata = { title: "Dashboard — Tailwinds" };

export default async function DashboardPage() {
  const aircraft = await getUserAircraft();

  if (aircraft.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <PlaneIcon className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold">Welcome to Tailwinds</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Add your aircraft to get started. You&apos;ll be logging flights and
          tracking costs in no time.
        </p>
        <Button
          render={<Link href="/dashboard/aircraft/new" />}
          nativeButton={false}
          size="lg"
        >
          Add Your Aircraft
        </Button>
      </div>
    );
  }

  const primaryAircraft = aircraft[0];
  const aircraftId = primaryAircraft?.id;

  const [currencies, stats, recentFlights, costProfile, expenses, flights] =
    await Promise.all([
      getCurrencyStatus(),
      getFlightStats(),
      getRecentFlights(5),
      aircraftId ? getCostProfile(aircraftId) : Promise.resolve(null),
      getTrailing12MonthExpenses(aircraftId),
      getMonthlyFlightHours(aircraftId),
    ]);

  // Determine cost teaser state
  const costData = calculateCostPerHour(costProfile, expenses, flights);
  const hasFuelData = expenses.some((e) => e.category === "fuel");
  const hasCostProfile = !!costProfile;

  let teaserState: "full" | "fuel-only" | "none" = "none";
  if (hasCostProfile && costData.totalHours > 0) {
    teaserState = "full";
  } else if (hasFuelData && costData.totalHours > 0) {
    teaserState = "fuel-only";
  }

  return (
    <div className="space-y-6">
      {/* Header with Log a Flight CTA */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button
          render={<Link href="/dashboard/logbook/new" />}
          nativeButton={false}
        >
          Log a Flight
        </Button>
      </div>

      {/* Currency Grid */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Currency Status
        </h2>
        <CurrencyGrid currencies={currencies} />
      </div>

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Cost Per Hour Teaser */}
      <CostTeaser
        state={teaserState}
        costPerHour={costData.totalCostPerHour}
        fuelPerHour={costData.fuelPerHour}
        aircraftId={aircraftId}
      />

      {/* Recent Flights */}
      <RecentFlights flights={recentFlights} />
    </div>
  );
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}
