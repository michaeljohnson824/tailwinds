import { createClient } from "@/lib/supabase/server";

export async function getEngineByAircraft(aircraftId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("engines")
    .select("*")
    .eq("aircraft_id", aircraftId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
