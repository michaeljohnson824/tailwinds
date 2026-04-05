import { z } from "zod";

const nonNegativeDecimal = z
  .number()
  .min(0, "Must be zero or positive")
  .nullable()
  .optional();

export const costProfileSchema = z.object({
  hangarMonthly: nonNegativeDecimal,
  insuranceAnnual: nonNegativeDecimal,
  annualEstimate: nonNegativeDecimal,
  loanMonthly: nonNegativeDecimal,
  subscriptionsMonthly: nonNegativeDecimal,
  otherAnnual: nonNegativeDecimal,
});

export type CostProfileFormData = z.infer<typeof costProfileSchema>;
