type Expense = {
  amount: string | number;
  date: string;
  category: string;
};

type Flight = {
  total_time: string | number | null;
  date: string;
};

type CostProfile = {
  hangar_monthly: string | number | null;
  insurance_monthly: string | number | null;
  annual_estimate: string | number | null;
  loan_monthly: string | number | null;
  subscriptions_monthly: string | number | null;
  engine_reserve_per_hour: string | number | null;
};

export type CategoryBreakdown = {
  category: string;
  total: number;
  perHour: number;
  percentage: number;
};

export type MonthlyTrend = {
  month: string;
  totalCostPerHour: number;
  variableCostPerHour: number;
  hours: number;
};

const FIXED_CATEGORIES = new Set([
  "hangar",
  "insurance",
  "annual",
  "subscription",
  "loan",
]);

const VARIABLE_CATEGORIES = new Set([
  "fuel",
  "oil",
  "maintenance",
  "upgrade",
  "other",
]);

export function calculateCostPerHour(
  costProfile: CostProfile | null,
  expenses: Expense[],
  flights: Flight[],
): {
  totalCostPerHour: number;
  fixedPerHour: number;
  fuelPerHour: number;
  maintenancePerHour: number;
  reservePerHour: number;
  totalHours: number;
  annualFixed: number;
} {
  const totalHours = flights.reduce(
    (sum, f) => sum + (f.total_time ? Number(f.total_time) : 0),
    0,
  );

  // Fixed costs from cost profile (annual)
  const annualFixed = costProfile
    ? (Number(costProfile.hangar_monthly ?? 0) +
        Number(costProfile.insurance_monthly ?? 0) +
        Number(costProfile.annual_estimate ?? 0) +
        Number(costProfile.loan_monthly ?? 0) +
        Number(costProfile.subscriptions_monthly ?? 0)) *
      12
    : 0;

  const fixedPerHour = totalHours > 0 ? annualFixed / totalHours : 0;

  // Variable costs from expenses
  const fuelTotal = expenses
    .filter((e) => e.category === "fuel")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const maintenanceTotal = expenses
    .filter((e) =>
      ["maintenance", "oil", "upgrade", "other", "annual"].includes(
        e.category,
      ),
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const fuelPerHour = totalHours > 0 ? fuelTotal / totalHours : 0;
  const maintenancePerHour =
    totalHours > 0 ? maintenanceTotal / totalHours : 0;

  const reservePerHour = Number(
    costProfile?.engine_reserve_per_hour ?? 0,
  );

  const totalCostPerHour =
    fixedPerHour + fuelPerHour + maintenancePerHour + reservePerHour;

  return {
    totalCostPerHour,
    fixedPerHour,
    fuelPerHour,
    maintenancePerHour,
    reservePerHour,
    totalHours,
    annualFixed,
  };
}

export function calculateCategoryBreakdown(
  costProfile: CostProfile | null,
  expenses: Expense[],
  totalHours: number,
): CategoryBreakdown[] {
  const categories: Record<string, number> = {};

  // Add cost profile fixed costs as categories
  if (costProfile) {
    const hangar = Number(costProfile.hangar_monthly ?? 0) * 12;
    const insurance = Number(costProfile.insurance_monthly ?? 0) * 12;
    const annual = Number(costProfile.annual_estimate ?? 0) * 12;
    const loan = Number(costProfile.loan_monthly ?? 0) * 12;
    const subs = Number(costProfile.subscriptions_monthly ?? 0) * 12;
    if (hangar > 0) categories["Hangar"] = hangar;
    if (insurance > 0) categories["Insurance"] = insurance;
    if (annual > 0) categories["Annual (fixed)"] = annual;
    if (loan > 0) categories["Loan"] = loan;
    if (subs > 0) categories["Subscriptions"] = subs;
  }

  // Add expenses by category
  for (const e of expenses) {
    const label = e.category.charAt(0).toUpperCase() + e.category.slice(1);
    const key =
      FIXED_CATEGORIES.has(e.category) && costProfile
        ? `${label} (additional)`
        : label;
    categories[key] = (categories[key] ?? 0) + Number(e.amount);
  }

  const grandTotal = Object.values(categories).reduce(
    (sum, v) => sum + v,
    0,
  );

  return Object.entries(categories)
    .map(([category, total]) => ({
      category,
      total,
      perHour: totalHours > 0 ? total / totalHours : 0,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calculateMonthlyTrend(
  costProfile: CostProfile | null,
  expenses: Expense[],
  flights: Flight[],
): MonthlyTrend[] {
  // Build a map of months
  const months: Record<
    string,
    { expenses: number; variableExpenses: number; hours: number }
  > = {};

  // Fill in 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = { expenses: 0, variableExpenses: 0, hours: 0 };
  }

  for (const e of expenses) {
    const monthKey = e.date.substring(0, 7);
    if (months[monthKey]) {
      months[monthKey].expenses += Number(e.amount);
      if (VARIABLE_CATEGORIES.has(e.category)) {
        months[monthKey].variableExpenses += Number(e.amount);
      }
    }
  }

  for (const f of flights) {
    const monthKey = f.date.substring(0, 7);
    if (months[monthKey]) {
      months[monthKey].hours += f.total_time ? Number(f.total_time) : 0;
    }
  }

  const monthlyFixed = costProfile
    ? Number(costProfile.hangar_monthly ?? 0) +
      Number(costProfile.insurance_monthly ?? 0) +
      Number(costProfile.annual_estimate ?? 0) +
      Number(costProfile.loan_monthly ?? 0) +
      Number(costProfile.subscriptions_monthly ?? 0)
    : 0;

  const reservePerHour = Number(
    costProfile?.engine_reserve_per_hour ?? 0,
  );

  // Calculate cumulative trailing values
  const monthKeys = Object.keys(months).sort();
  const result: MonthlyTrend[] = [];

  for (let i = 0; i < monthKeys.length; i++) {
    const key = monthKeys[i];
    const m = months[key];

    // Use cumulative trailing hours and expenses up to this month
    let trailingHours = 0;
    let trailingVariable = 0;
    for (let j = 0; j <= i; j++) {
      const mk = monthKeys[j];
      trailingHours += months[mk].hours;
      trailingVariable += months[mk].variableExpenses;
    }

    const trailingMonths = i + 1;
    const annualizedFixed = monthlyFixed * 12;
    const fixedPH =
      trailingHours > 0
        ? annualizedFixed / (trailingHours * (12 / trailingMonths))
        : 0;
    const variablePH =
      trailingHours > 0 ? trailingVariable / trailingHours : 0;

    const label = new Date(key + "-01").toLocaleDateString("en-US", {
      month: "short",
    });

    result.push({
      month: label,
      totalCostPerHour:
        trailingHours > 0 ? fixedPH + variablePH + reservePerHour : 0,
      variableCostPerHour: variablePH,
      hours: m.hours,
    });
  }

  return result;
}

export function calculateUtilizationInsight(
  annualFixed: number,
  totalHours: number,
): { message: string; marginalReduction: number } {
  const marginalReduction =
    totalHours > 0
      ? annualFixed / totalHours - annualFixed / (totalHours + 1)
      : 0;

  const message = `You flew ${totalHours.toFixed(1)} hours in the last 12 months. Each additional hour reduces your fixed cost per hour by $${marginalReduction.toFixed(2)}.`;

  return { message, marginalReduction };
}

export const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];
