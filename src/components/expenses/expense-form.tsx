"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/validations/expense";

type Aircraft = { id: string; tail_number: string };

type ExpenseData = {
  id?: string;
  aircraft_id?: string;
  category?: string;
  amount?: number | string;
  date?: string;
  description?: string | null;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  receipt_url?: string | null;
};

export function ExpenseForm({
  expense,
  aircraft,
  action,
  onCancel,
}: {
  expense?: ExpenseData;
  aircraft: Aircraft[];
  action: (
    prev: { error: string | null },
    formData: FormData,
  ) => Promise<{ error: string | null }>;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [isRecurring, setIsRecurring] = useState(expense?.is_recurring ?? false);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="aircraftId">Aircraft</Label>
          <select
            id="aircraftId"
            name="aircraftId"
            defaultValue={expense?.aircraft_id ?? aircraft[0]?.id ?? ""}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {aircraft.map((a) => (
              <option key={a.id} value={a.id}>
                {a.tail_number}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={expense?.category ?? "maintenance"}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat as ExpenseCategory]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            defaultValue={expense?.amount != null ? Number(expense.amount) : ""}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={expense?.date ?? today}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Oil change, annual inspection, etc."
          defaultValue={expense?.description ?? ""}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Recurring expense
        </label>
        {isRecurring && (
          <select
            name="recurrenceInterval"
            defaultValue={expense?.recurrence_interval ?? "monthly"}
            className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="receiptFile">Receipt Photo (optional)</Label>
        <Input
          id="receiptFile"
          name="receiptFile"
          type="file"
          accept="image/*"
          className="text-sm"
        />
        {expense?.receipt_url && (
          <input type="hidden" name="receiptUrl" value={expense.receipt_url} />
        )}
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending} className={onCancel ? "flex-1" : "w-full"}>
          {pending ? "Saving..." : expense?.id ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
