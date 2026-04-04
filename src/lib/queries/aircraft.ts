import { createClient } from "@/lib/supabase/server";

export async function getUserAircraft() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("aircraft")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAircraft(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("aircraft")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}
