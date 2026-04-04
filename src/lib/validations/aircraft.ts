import { z } from "zod";

export const aircraftSchema = z.object({
  tailNumber: z
    .string()
    .min(1, "Tail number is required")
    .max(10)
    .transform((val) => val.toUpperCase().trim()),
  makeModel: z
    .string()
    .min(1, "Make/model is required")
    .max(100),
  year: z
    .number()
    .int()
    .min(1903, "Year must be 1903 or later")
    .max(new Date().getFullYear() + 1)
    .nullable()
    .optional(),
  homeAirport: z
    .string()
    .max(4)
    .transform((val) => val.toUpperCase().trim())
    .nullable()
    .optional(),
  hobbsCurrent: z
    .number()
    .min(0, "Hobbs must be positive")
    .nullable()
    .optional(),
  tachCurrent: z
    .number()
    .min(0, "Tach must be positive")
    .nullable()
    .optional(),
});

export type AircraftFormData = z.infer<typeof aircraftSchema>;
