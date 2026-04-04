"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const displayName = (formData.get("displayName") as string) || null;
  const medicalClass = formData.get("medicalClass")
    ? Number(formData.get("medicalClass"))
    : null;
  const medicalExpiration =
    (formData.get("medicalExpiration") as string) || null;
  const flightReviewDate =
    (formData.get("flightReviewDate") as string) || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      medical_class: medicalClass,
      medical_expiration: medicalExpiration,
      flight_review_date: flightReviewDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { error: null };
}
