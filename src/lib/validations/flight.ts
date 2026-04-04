import { z } from "zod";

export const flightSchema = z
  .object({
    aircraftId: z.string().min(1, "Aircraft is required"),
    date: z.string().min(1, "Date is required"),
    routeFrom: z
      .string()
      .min(1, "Departure airport is required")
      .max(4)
      .transform((v) => v.toUpperCase().trim()),
    routeTo: z
      .string()
      .max(4)
      .transform((v) => v.toUpperCase().trim())
      .optional()
      .default(""),
    routeVia: z.string().optional().default(""),
    hobbsStart: z.number({ message: "Hobbs start is required" }).min(0),
    hobbsEnd: z.number({ message: "Hobbs end is required" }).min(0),
    tachStart: z.number().min(0).nullable().optional(),
    tachEnd: z.number().min(0).nullable().optional(),
    totalTime: z.number().min(0).nullable().optional(),
    landingsDay: z.number().int().min(0).default(1),
    landingsNight: z.number().int().min(0).default(0),
    conditions: z.enum(["VFR", "IFR", "SVFR"]).default("VFR"),
    nightTime: z.number().min(0).default(0),
    instrumentTime: z.number().min(0).default(0),
    instrumentApproaches: z.number().int().min(0).default(0),
    crossCountry: z.boolean().default(false),
    picTime: z.number().min(0).default(0),
    sicTime: z.number().min(0).default(0),
    dualGiven: z.number().min(0).default(0),
    dualReceived: z.number().min(0).default(0),
    fuelGallons: z.number().min(0).nullable().optional(),
    fuelPricePerGallon: z.number().min(0).nullable().optional(),
    remarks: z.string().optional().default(""),
  })
  .refine((data) => data.hobbsEnd > data.hobbsStart, {
    message: "Hobbs end must be greater than hobbs start",
    path: ["hobbsEnd"],
  });

export type FlightFormData = z.infer<typeof flightSchema>;
