"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { flightSchema } from "@/lib/validations/flight";

function parseNum(val: FormDataEntryValue | null): number | null {
  if (!val || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseFormData(formData: FormData) {
  return {
    aircraftId: formData.get("aircraftId") as string,
    date: formData.get("date") as string,
    routeFrom: (formData.get("routeFrom") as string) ?? "",
    routeTo: (formData.get("routeTo") as string) ?? "",
    routeVia: (formData.get("routeVia") as string) ?? "",
    hobbsStart: parseNum(formData.get("hobbsStart")) ?? 0,
    hobbsEnd: parseNum(formData.get("hobbsEnd")) ?? 0,
    tachStart: parseNum(formData.get("tachStart")),
    tachEnd: parseNum(formData.get("tachEnd")),
    totalTime: parseNum(formData.get("totalTime")),
    landingsDay: parseNum(formData.get("landingsDay")) ?? 1,
    landingsNight: parseNum(formData.get("landingsNight")) ?? 0,
    conditions: (formData.get("conditions") as string) ?? "VFR",
    nightTime: parseNum(formData.get("nightTime")) ?? 0,
    instrumentTime: parseNum(formData.get("instrumentTime")) ?? 0,
    instrumentApproaches: parseNum(formData.get("instrumentApproaches")) ?? 0,
    crossCountry: formData.get("crossCountry") === "on",
    picTime: parseNum(formData.get("picTime")) ?? 0,
    sicTime: parseNum(formData.get("sicTime")) ?? 0,
    dualGiven: parseNum(formData.get("dualGiven")) ?? 0,
    dualReceived: parseNum(formData.get("dualReceived")) ?? 0,
    fuelGallons: parseNum(formData.get("fuelGallons")),
    fuelPricePerGallon: parseNum(formData.get("fuelPricePerGallon")),
    remarks: (formData.get("remarks") as string) ?? "",
  };
}

export async function createFlight(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = parseFormData(formData);
  const parsed = flightSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const totalTime = d.totalTime ?? Math.round((d.hobbsEnd - d.hobbsStart) * 10) / 10;
  const fuelTotalCost =
    d.fuelGallons && d.fuelPricePerGallon
      ? Math.round(d.fuelGallons * d.fuelPricePerGallon * 100) / 100
      : null;

  const { error } = await supabase.from("flights").insert({
    aircraft_id: d.aircraftId,
    pilot_id: user.id,
    date: d.date,
    route_from: d.routeFrom,
    route_to: d.routeTo || null,
    route_via: d.routeVia || null,
    hobbs_start: d.hobbsStart,
    hobbs_end: d.hobbsEnd,
    tach_start: d.tachStart,
    tach_end: d.tachEnd,
    total_time: totalTime,
    landings_day: d.landingsDay,
    landings_night: d.landingsNight,
    conditions: d.conditions,
    night_time: d.nightTime,
    instrument_time: d.instrumentTime,
    instrument_approaches: d.instrumentApproaches,
    cross_country: d.crossCountry,
    pic_time: d.picTime,
    sic_time: d.sicTime,
    dual_given: d.dualGiven,
    dual_received: d.dualReceived,
    fuel_gallons: d.fuelGallons,
    fuel_price_per_gallon: d.fuelPricePerGallon,
    fuel_total_cost: fuelTotalCost,
    remarks: d.remarks || null,
  });

  if (error) return { error: error.message };

  // Auto-create fuel expense if fuel data was provided
  if (fuelTotalCost && d.fuelGallons && d.fuelPricePerGallon) {
    const from = d.routeFrom || "???";
    const to = d.routeTo || "???";
    const desc = `Fuel — ${from} to ${to}, ${d.fuelGallons.toFixed(1)} gal @ $${d.fuelPricePerGallon.toFixed(2)}`;
    await supabase.from("expenses").insert({
      aircraft_id: d.aircraftId,
      recorded_by: user.id,
      category: "fuel",
      amount: fuelTotalCost,
      date: d.date,
      description: desc,
    });
  }

  // Update aircraft hobbs and tach to end values
  const updates: Record<string, unknown> = {
    hobbs_current: d.hobbsEnd,
    updated_at: new Date().toISOString(),
  };
  if (d.tachEnd != null) {
    updates.tach_current = d.tachEnd;
  }

  await supabase
    .from("aircraft")
    .update(updates)
    .eq("id", d.aircraftId)
    .eq("owner_id", user.id);

  revalidatePath("/dashboard/logbook");
  revalidatePath("/dashboard/aircraft");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/costs");
  revalidatePath("/dashboard");
  redirect("/dashboard/logbook");
}

export async function updateFlight(
  id: string,
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = parseFormData(formData);
  const parsed = flightSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const totalTime = d.totalTime ?? Math.round((d.hobbsEnd - d.hobbsStart) * 10) / 10;
  const fuelTotalCost =
    d.fuelGallons && d.fuelPricePerGallon
      ? Math.round(d.fuelGallons * d.fuelPricePerGallon * 100) / 100
      : null;

  const { error } = await supabase
    .from("flights")
    .update({
      aircraft_id: d.aircraftId,
      date: d.date,
      route_from: d.routeFrom,
      route_to: d.routeTo || null,
      route_via: d.routeVia || null,
      hobbs_start: d.hobbsStart,
      hobbs_end: d.hobbsEnd,
      tach_start: d.tachStart,
      tach_end: d.tachEnd,
      total_time: totalTime,
      landings_day: d.landingsDay,
      landings_night: d.landingsNight,
      conditions: d.conditions,
      night_time: d.nightTime,
      instrument_time: d.instrumentTime,
      instrument_approaches: d.instrumentApproaches,
      cross_country: d.crossCountry,
      pic_time: d.picTime,
      sic_time: d.sicTime,
      dual_given: d.dualGiven,
      dual_received: d.dualReceived,
      fuel_gallons: d.fuelGallons,
      fuel_price_per_gallon: d.fuelPricePerGallon,
      fuel_total_cost: fuelTotalCost,
      remarks: d.remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("pilot_id", user.id);

  if (error) return { error: error.message };

  // Update aircraft hobbs and tach
  const updates: Record<string, unknown> = {
    hobbs_current: d.hobbsEnd,
    updated_at: new Date().toISOString(),
  };
  if (d.tachEnd != null) {
    updates.tach_current = d.tachEnd;
  }

  await supabase
    .from("aircraft")
    .update(updates)
    .eq("id", d.aircraftId)
    .eq("owner_id", user.id);

  revalidatePath("/dashboard/logbook");
  revalidatePath("/dashboard/aircraft");
  revalidatePath("/dashboard");
  redirect("/dashboard/logbook");
}

export async function deleteFlight(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase
    .from("flights")
    .delete()
    .eq("id", id)
    .eq("pilot_id", user.id);

  revalidatePath("/dashboard/logbook");
  revalidatePath("/dashboard");
  redirect("/dashboard/logbook");
}
