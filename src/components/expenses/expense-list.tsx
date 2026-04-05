"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type ExpenseCategory,
} from "@/lib/validations/expense";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { deleteExpense, updateExpense } from "@/lib/actions/expenses";

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

export function ExpenseList({
  expenses,
  aircraft,
  monthlyTotal,
}: {
  expenses: Expense[];
  aircraft: Aircraft[];
  monthlyTotal: number;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Monthly Total */}
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <p className="text-sm text-muted-foreground">This month&apos;s expenses</p>
          <p className="text-lg font-bold">${monthlyTotal.toFixed(2)}</p>
        </CardContent>
      </Card>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No expenses recorded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => {
            const cat = expense.category as ExpenseCategory;
            const colorClass =
              CATEGORY_COLORS[cat] ?? "bg-gray-500/20 text-gray-400";
            const label = CATEGORY_LABELS[cat] ?? expense.category;

            if (editingId === expense.id) {
              const editAction = updateExpense.bind(null, expense.id);
              return (
                <Card key={expense.id}>
                  <CardHeader>
                    <CardTitle className="text-base">Edit Expense</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExpenseForm
                      expense={expense}
                      aircraft={aircraft}
                      action={editAction}
                      onCancel={() => setEditingId(null)}
                    />
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={expense.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {expense.date}
                      </span>
                      {expense.aircraft && (
                        <span className="text-xs text-muted-foreground">
                          {expense.aircraft.tail_number}
                        </span>
                      )}
                      {expense.is_recurring && (
                        <Badge variant="outline" className="text-[10px] px-1.5 h-4">
                          {expense.recurrence_interval}
                        </Badge>
                      )}
                    </div>
                    {expense.description && (
                      <p className="mt-1 text-sm text-muted-foreground truncate">
                        {expense.description}
                      </p>
                    )}
                    {expense.receipt_url && (
                      <button
                        onClick={() =>
                          setExpandedReceipt(
                            expandedReceipt === expense.id ? null : expense.id,
                          )
                        }
                        className="mt-1 text-xs text-primary hover:underline"
                      >
                        {expandedReceipt === expense.id
                          ? "Hide receipt"
                          : "View receipt"}
                      </button>
                    )}
                    {expandedReceipt === expense.id && expense.receipt_url && (
                      <div className="mt-2">
                        <img
                          src={expense.receipt_url}
                          alt="Receipt"
                          className="max-w-xs rounded-md border border-border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {expense.receipt_url && expandedReceipt !== expense.id && (
                      <button
                        onClick={() => setExpandedReceipt(expense.id)}
                        className="h-8 w-8 rounded border border-border overflow-hidden"
                      >
                        <img
                          src={expense.receipt_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )}
                    <span className="font-medium tabular-nums">
                      ${Number(expense.amount).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => setEditingId(expense.id)}
                    >
                      Edit
                    </Button>
                    <form
                      action={async () => {
                        await deleteExpense(expense.id);
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
