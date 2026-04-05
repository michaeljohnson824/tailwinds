"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { engineSchema } from "@/lib/validations/engine";

export async function createEngine(
  aircraftId: string,
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = {
    makeModel: (formData.get("makeModel") as string) || null,
    tboHours: formData.get("tboHours") ? Number(formData.get("tboHours")) : null,
    tsmoh: formData.get("tsmoh") ? Number(formData.get("tsmoh")) : null,
    overhaulCostEstimate: formData.get("overhaulCostEstimate")
      ? Number(formData.get("overhaulCostEstimate"))
      : null,
    lastOilChangeTach: formData.get("lastOilChangeTach")
      ? Number(formData.get("lastOilChangeTach"))
      : null,
    oilChangeIntervalHours: formData.get("oilChangeIntervalHours")
      ? Number(formData.get("oilChangeIntervalHours"))
      : null,
  };

  const parsed = engineSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase.from("engines").insert({
    aircraft_id: aircraftId,
    make_model: parsed.data.makeModel ?? null,
    tbo_hours: parsed.data.tboHours ?? null,
    tsmoh: parsed.data.tsmoh ?? null,
    overhaul_cost_estimate: parsed.data.overhaulCostEstimate ?? null,
    last_oil_change_tach: parsed.data.lastOilChangeTach ?? null,
    oil_change_interval_hours: parsed.data.oilChangeIntervalHours ?? 50,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/aircraft/${aircraftId}`);
  return { error: null };
}

export async function updateEngine(
  engineId: string,
  aircraftId: string,
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = {
    makeModel: (formData.get("makeModel") as string) || null,
    tboHours: formData.get("tboHours") ? Number(formData.get("tboHours")) : null,
    tsmoh: formData.get("tsmoh") ? Number(formData.get("tsmoh")) : null,
    overhaulCostEstimate: formData.get("overhaulCostEstimate")
      ? Number(formData.get("overhaulCostEstimate"))
      : null,
    lastOilChangeTach: formData.get("lastOilChangeTach")
      ? Number(formData.get("lastOilChangeTach"))
      : null,
    oilChangeIntervalHours: formData.get("oilChangeIntervalHours")
      ? Number(formData.get("oilChangeIntervalHours"))
      : null,
  };

  const parsed = engineSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase
    .from("engines")
    .update({
      make_model: parsed.data.makeModel ?? null,
      tbo_hours: parsed.data.tboHours ?? null,
      tsmoh: parsed.data.tsmoh ?? null,
      overhaul_cost_estimate: parsed.data.overhaulCostEstimate ?? null,
      last_oil_change_tach: parsed.data.lastOilChangeTach ?? null,
      oil_change_interval_hours: parsed.data.oilChangeIntervalHours ?? 50,
      updated_at: new Date().toISOString(),
    })
    .eq("id", engineId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/aircraft/${aircraftId}`);
  return { error: null };
}
