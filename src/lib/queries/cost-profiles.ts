import { createClient } from "@/lib/supabase/server";

export async function getCostProfile(aircraftId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cost_profiles")
    .select("*")
    .eq("aircraft_id", aircraftId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getTrailing12MonthHours(aircraftId: string) {
  const supabase = await createClient();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const dateStr = twelveMonthsAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("flights")
    .select("total_time")
    .eq("aircraft_id", aircraftId)
    .gte("date", dateStr);

  if (error) throw error;

  const totalHours = (data ?? []).reduce(
    (sum, f) => sum + (f.total_time ? Number(f.total_time) : 0),
    0,
  );

  return { totalHours, flightCount: data?.length ?? 0 };
}
