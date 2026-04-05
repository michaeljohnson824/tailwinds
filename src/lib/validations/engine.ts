import { z } from "zod";

export const engineSchema = z.object({
  makeModel: z.string().max(100).nullable().optional(),
  tboHours: z
    .number()
    .int()
    .min(0, "TBO must be positive")
    .nullable()
    .optional(),
  tsmoh: z
    .number()
    .min(0, "TSMOH must be positive")
    .nullable()
    .optional(),
  overhaulCostEstimate: z
    .number()
    .min(0, "Overhaul cost must be positive")
    .nullable()
    .optional(),
  lastOilChangeTach: z
    .number()
    .min(0, "Tach reading must be positive")
    .nullable()
    .optional(),
  oilChangeIntervalHours: z
    .number()
    .int()
    .min(1, "Interval must be at least 1 hour")
    .nullable()
    .optional(),
});

export type EngineFormData = z.infer<typeof engineSchema>;
