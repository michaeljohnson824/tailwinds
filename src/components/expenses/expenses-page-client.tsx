"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/validations/expense";

type Expense = {
  id: string;
  aircraft_id: string;
  category: string;
  amount: string | number;
  date: string;
  description: string | null;
  is_recurring: boolean;
  recurrence_interval: string | null;
  receipt_url: string | null;
  aircraft: { tail_number: string } | null;
};

type Aircraft = { id: string; tail_number: string };

export function ExpensesPageClient({
  expenses,
  aircraft,
  monthlyTotal,
  createAction,
  filters,
}: {
  expenses: Expense[];
  aircraft: Aircraft[];
  monthlyTotal: number;
  createAction: (
    prev: { error: string | null },
    formData: FormData,
  ) => Promise<{ error: string | null }>;
  filters: { category: string; aircraftId: string };
}) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams();
    if (key === "category" && value) params.set("category", value);
    else if (filters.category) params.set("category", filters.category);
    if (key === "aircraftId" && value) params.set("aircraftId", value);
    else if (filters.aircraftId) params.set("aircraftId", filters.aircraftId);
    // Clear the param if value is empty
    if (key === "category" && !value) params.delete("category");
    if (key === "aircraftId" && !value) params.delete("aircraftId");
    const qs = params.toString();
    router.push(`/dashboard/expenses${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Expense"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              aircraft={aircraft}
              action={createAction}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat as ExpenseCategory]}
            </option>
          ))}
        </select>
        {aircraft.length > 1 && (
          <select
            value={filters.aircraftId}
            onChange={(e) => updateFilter("aircraftId", e.target.value)}
            className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            <option value="">All aircraft</option>
            {aircraft.map((a) => (
              <option key={a.id} value={a.id}>
                {a.tail_number}
              </option>
            ))}
          </select>
        )}
      </div>

      <ExpenseList
        expenses={expenses}
        aircraft={aircraft}
        monthlyTotal={monthlyTotal}
      />
    </div>
  );
}
