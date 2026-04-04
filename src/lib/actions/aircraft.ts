"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aircraftSchema } from "@/lib/validations/aircraft";

export async function createAircraft(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const raw = {
    tailNumber: formData.get("tailNumber") as string,
    makeModel: formData.get("makeModel") as string,
    year: formData.get("year") ? Number(formData.get("year")) : null,
    homeAirport: (formData.get("homeAirport") as string) || null,
    hobbsCurrent: formData.get("hobbsCurrent") ? Number(formData.get("hobbsCurrent")) : null,
    tachCurrent: formData.get("tachCurrent") ? Number(formData.get("tachCurrent")) : null,
  };

  const parsed = aircraftSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  const { error } = await supabase.from("aircraft").insert({
    owner_id: user.id,
    tail_number: parsed.data.tailNumber,
    make_model: parsed.data.makeModel,
    year: parsed.data.year ?? null,
    home_airport: parsed.data.homeAirport ?? null,
    hobbs_current: parsed.data.hobbsCurrent ?? null,
    tach_current: parsed.data.tachCurrent ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/aircraft");
  revalidatePath("/dashboard");
  redirect("/dashboard/aircraft");
}

export async function updateAircraft(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const raw = {
    tailNumber: formData.get("tailNumber") as string,
    makeModel: formData.get("makeModel") as string,
    year: formData.get("year") ? Number(formData.get("year")) : null,
    homeAirport: (formData.get("homeAirport") as string) || null,
    hobbsCurrent: formData.get("hobbsCurrent") ? Number(formData.get("hobbsCurrent")) : null,
    tachCurrent: formData.get("tachCurrent") ? Number(formData.get("tachCurrent")) : null,
  };

  const parsed = aircraftSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  const { error } = await supabase
    .from("aircraft")
    .update({
      tail_number: parsed.data.tailNumber,
      make_model: parsed.data.makeModel,
      year: parsed.data.year ?? null,
      home_airport: parsed.data.homeAirport ?? null,
      hobbs_current: parsed.data.hobbsCurrent ?? null,
      tach_current: parsed.data.tachCurrent ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/aircraft");
  revalidatePath(`/dashboard/aircraft/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/aircraft/${id}`);
}

export async function deleteAircraft(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("aircraft")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/aircraft");
  revalidatePath("/dashboard");
  redirect("/dashboard/aircraft");
}
