"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ParsedFlight } from "@/lib/utils/csv-parser";

export type ImportResult = {
  success: boolean;
  imported: number;
  skipped: { row: number; reason: string }[];
  error?: string;
};

export async function importFlights(
  aircraftId: string,
  flights: ParsedFlight[]
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, imported: 0, skipped: [], error: "Not authenticated" };

  // Fetch existing flights for duplicate detection
  const { data: existing } = await supabase
    .from("flights")
    .select("date, route_from, total_time")
    .eq("pilot_id", user.id)
    .eq("aircraft_id", aircraftId);

  const existingSet = new Set(
    (existing ?? []).map(
      (f) => `${f.date}|${f.route_from ?? ""}|${Number(f.total_time ?? 0).toFixed(1)}`
    )
  );

  const toInsert: Record<string, unknown>[] = [];
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 0; i < flights.length; i++) {
    const f = flights[i];

    // Duplicate check
    const key = `${f.date}|${f.route_from ?? ""}|${(f.total_time ?? 0).toFixed(1)}`;
    if (existingSet.has(key)) {
      skipped.push({ row: i + 1, reason: "Duplicate flight (same date, route, time)" });
      continue;
    }
    existingSet.add(key); // Prevent duplicates within the import batch too

    toInsert.push({
      aircraft_id: aircraftId,
      pilot_id: user.id,
      date: f.date,
      route_from: f.route_from,
      route_to: f.route_to,
      route_via: f.route_via,
      total_time: f.total_time,
      landings_day: f.landings_day,
      landings_night: f.landings_night,
      conditions: ["VFR", "IFR", "SVFR"].includes(f.conditions) ? f.conditions : "VFR",
      night_time: f.night_time,
      instrument_time: f.instrument_time,
      instrument_approaches: f.instrument_approaches,
      cross_country: f.cross_country,
      pic_time: f.pic_time,
      sic_time: f.sic_time,
      dual_given: f.dual_given,
      dual_received: f.dual_received,
      fuel_gallons: f.fuel_gallons,
      fuel_price_per_gallon: null,
      fuel_total_cost: null,
      remarks: f.remarks,
    });
  }

  if (toInsert.length === 0) {
    return { success: true, imported: 0, skipped };
  }

  // Batch insert (Supabase handles up to 1000 per request)
  const batchSize = 500;
  let imported = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("flights").insert(batch);
    if (error) {
      return {
        success: false,
        imported,
        skipped,
        error: `Insert failed at batch ${Math.floor(i / batchSize) + 1}: ${error.message}`,
      };
    }
    imported += batch.length;
  }

  revalidatePath("/dashboard/logbook");
  revalidatePath("/dashboard");

  return { success: true, imported, skipped };
}
