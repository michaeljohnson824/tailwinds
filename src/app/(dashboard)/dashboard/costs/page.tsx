import { getUserAircraft } from "@/lib/queries/aircraft";
import { getProfile } from "@/lib/queries/profile";
import { getCostProfile } from "@/lib/queries/cost-profiles";
import {
  getTrailing12MonthExpenses,
  getMonthlyFlightHours,
} from "@/lib/queries/expenses";
import {
  calculateCostPerHour,
  calculateCategoryBreakdown,
  calculateMonthlyTrend,
  calculateUtilizationInsight,
} from "@/lib/utils/costs";
import { isPaidUser } from "@/lib/utils/subscription";
import { CostDashboardClient } from "@/components/costs/cost-dashboard-client";
import { PaywallModal } from "@/components/paywall/paywall-modal";

export default async function CostDashboardPage() {
  const profile = await getProfile();
  if (!isPaidUser(profile)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Cost Dashboard</h1>
        <PaywallModal />
      </div>
    );
  }

  const aircraft = await getUserAircraft();

  // For now, use the first aircraft. Later we can add an aircraft selector.
  const primaryAircraft = aircraft[0] ?? null;
  const aircraftId = primaryAircraft?.id;

  const [costProfile, expenses, flights] = await Promise.all([
    aircraftId ? getCostProfile(aircraftId) : Promise.resolve(null),
    getTrailing12MonthExpenses(aircraftId),
    getMonthlyFlightHours(aircraftId),
  ]);

  const costData = calculateCostPerHour(costProfile, expenses, flights);
  const breakdown = calculateCategoryBreakdown(
    costProfile,
    expenses,
    costData.totalHours,
  );
  const trend = calculateMonthlyTrend(costProfile, expenses, flights);
  const utilization = calculateUtilizationInsight(
    costData.annualFixed,
    costData.totalHours,
  );

  // Expense summary table: group by category
  const categorySummary = breakdown.map((b) => ({
    category: b.category,
    total: b.total,
    perHour: b.perHour,
    percentage: b.percentage,
  }));

  return (
    <CostDashboardClient
      aircraft={primaryAircraft}
      costData={costData}
      breakdown={breakdown}
      trend={trend}
      utilization={utilization}
      categorySummary={categorySummary}
      hasCostProfile={!!costProfile}
    />
  );
}
