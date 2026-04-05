import { getUserExpenses } from "@/lib/queries/expenses";
import { getUserAircraft } from "@/lib/queries/aircraft";
import { getProfile } from "@/lib/queries/profile";
import { isPaidUser } from "@/lib/utils/subscription";
import { createExpense } from "@/lib/actions/expenses";
import { ExpensesPageClient } from "@/components/expenses/expenses-page-client";
import { PaywallModal } from "@/components/paywall/paywall-modal";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; aircraftId?: string }>;
}) {
  const profile = await getProfile();
  if (!isPaidUser(profile)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <PaywallModal />
      </div>
    );
  }

  const params = await searchParams;
  const [expenses, aircraft] = await Promise.all([
    getUserExpenses({
      category: params.category,
      aircraftId: params.aircraftId,
    }),
    getUserAircraft(),
  ]);

  // Calculate this month's total
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyTotal = expenses
    .filter((e) => e.date.startsWith(thisMonthStr))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <ExpensesPageClient
      expenses={expenses}
      aircraft={aircraft}
      monthlyTotal={monthlyTotal}
      createAction={createExpense}
      filters={{
        category: params.category ?? "",
        aircraftId: params.aircraftId ?? "",
      }}
    />
  );
}
