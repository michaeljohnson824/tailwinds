import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "hangar",
  "insurance",
  "annual",
  "maintenance",
  "fuel",
  "oil",
  "subscription",
  "loan",
  "upgrade",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  hangar: "Hangar",
  insurance: "Insurance",
  annual: "Annual",
  maintenance: "Maintenance",
  fuel: "Fuel",
  oil: "Oil",
  subscription: "Subscription",
  loan: "Loan",
  upgrade: "Upgrade",
  other: "Other",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  hangar: "bg-blue-500/20 text-blue-400",
  insurance: "bg-purple-500/20 text-purple-400",
  annual: "bg-amber-500/20 text-amber-400",
  maintenance: "bg-red-500/20 text-red-400",
  fuel: "bg-emerald-500/20 text-emerald-400",
  oil: "bg-yellow-500/20 text-yellow-400",
  subscription: "bg-cyan-500/20 text-cyan-400",
  loan: "bg-pink-500/20 text-pink-400",
  upgrade: "bg-orange-500/20 text-orange-400",
  other: "bg-gray-500/20 text-gray-400",
};

export const expenseSchema = z.object({
  aircraftId: z.string().min(1, "Aircraft is required"),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Invalid category" }),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  description: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
  recurrenceInterval: z.enum(["monthly", "quarterly", "annual"]).nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
