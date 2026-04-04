import { createClient } from "@/lib/supabase/server";

export type FlightStats = {
  totalHours: number;
  flightsThisMonth: number;
  hoursThisMonth: number;
  hoursThisYear: number;
};

export async function getFlightStats(): Promise<FlightStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { totalHours: 0, flightsThisMonth: 0, hoursThisMonth: 0, hoursThisYear: 0 };

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const yearStart = `${now.getFullYear()}-01-01`;

  // All flights for totals
  const { data: allFlights } = await supabase
    .from("flights")
    .select("date, total_time")
    .eq("pilot_id", user.id);

  const flights = allFlights ?? [];

  const totalHours = flights.reduce(
    (sum, f) => sum + (f.total_time != null ? Number(f.total_time) : 0),
    0
  );

  const thisMonth = flights.filter((f) => f.date >= monthStart);
  const flightsThisMonth = thisMonth.length;
  const hoursThisMonth = thisMonth.reduce(
    (sum, f) => sum + (f.total_time != null ? Number(f.total_time) : 0),
    0
  );

  const thisYear = flights.filter((f) => f.date >= yearStart);
  const hoursThisYear = thisYear.reduce(
    (sum, f) => sum + (f.total_time != null ? Number(f.total_time) : 0),
    0
  );

  return { totalHours, flightsThisMonth, hoursThisMonth, hoursThisYear };
}

export async function getRecentFlights(limit = 5) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("flights")
    .select("id, date, route_from, route_to, total_time, conditions, aircraft:aircraft_id(tail_number)")
    .eq("pilot_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
