import { createClient } from "@/lib/supabase/server";

export type ExpenseFilters = {
  aircraftId?: string;
  category?: string;
};

export async function getUserExpenses(filters?: ExpenseFilters) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("expenses")
    .select("*, aircraft:aircraft_id(tail_number)")
    .eq("recorded_by", user.id)
    .order("date", { ascending: false });

  if (filters?.aircraftId) {
    query = query.eq("aircraft_id", filters.aircraftId);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getExpense(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*, aircraft:aircraft_id(tail_number)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getTrailing12MonthExpenses(aircraftId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const dateStr = twelveMonthsAgo.toISOString().split("T")[0];

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("recorded_by", user.id)
    .gte("date", dateStr);

  if (aircraftId) {
    query = query.eq("aircraft_id", aircraftId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMonthlyExpenseData(aircraftId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const dateStr = twelveMonthsAgo.toISOString().split("T")[0];

  let query = supabase
    .from("expenses")
    .select("amount, date, category")
    .eq("recorded_by", user.id)
    .gte("date", dateStr)
    .order("date", { ascending: true });

  if (aircraftId) {
    query = query.eq("aircraft_id", aircraftId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMonthlyFlightHours(aircraftId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const dateStr = twelveMonthsAgo.toISOString().split("T")[0];

  let query = supabase
    .from("flights")
    .select("total_time, date")
    .eq("pilot_id", user.id)
    .gte("date", dateStr)
    .order("date", { ascending: true });

  if (aircraftId) {
    query = query.eq("aircraft_id", aircraftId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
