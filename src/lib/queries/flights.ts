import { createClient } from "@/lib/supabase/server";

export type FlightFilters = {
  aircraftId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export async function getUserFlights(filters?: FlightFilters) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("flights")
    .select("*, aircraft:aircraft_id(tail_number)")
    .eq("pilot_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.aircraftId) {
    query = query.eq("aircraft_id", filters.aircraftId);
  }
  if (filters?.dateFrom) {
    query = query.gte("date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("date", filters.dateTo);
  }
  if (filters?.search) {
    query = query.ilike("remarks", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getFlight(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("flights")
    .select("*, aircraft:aircraft_id(tail_number, make_model)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}
