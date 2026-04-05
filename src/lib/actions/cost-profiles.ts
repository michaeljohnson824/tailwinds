"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { costProfileSchema } from "@/lib/validations/cost-profile";

export async function createCostProfile(
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
    hangarMonthly: formData.get("hangarMonthly")
      ? Number(formData.get("hangarMonthly"))
      : null,
    insuranceAnnual: formData.get("insuranceAnnual")
      ? Number(formData.get("insuranceAnnual"))
      : null,
    annualEstimate: formData.get("annualEstimate")
      ? Number(formData.get("annualEstimate"))
      : null,
    loanMonthly: formData.get("loanMonthly")
      ? Number(formData.get("loanMonthly"))
      : null,
    subscriptionsMonthly: formData.get("subscriptionsMonthly")
      ? Number(formData.get("subscriptionsMonthly"))
      : null,
    otherAnnual: formData.get("otherAnnual")
      ? Number(formData.get("otherAnnual"))
      : null,
  };

  const parsed = costProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Convert annual values to monthly for storage
  const insuranceMonthly = (parsed.data.insuranceAnnual ?? 0) / 12;
  const annualEstimateMonthly = (parsed.data.annualEstimate ?? 0) / 12;
  const otherMonthly = (parsed.data.otherAnnual ?? 0) / 12;

  // Check if a cost profile already exists for this aircraft
  const { data: existing } = await supabase
    .from("cost_profiles")
    .select("id")
    .eq("aircraft_id", aircraftId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cost_profiles")
      .update({
        hangar_monthly: parsed.data.hangarMonthly ?? 0,
        insurance_monthly: insuranceMonthly,
        annual_estimate: annualEstimateMonthly,
        loan_monthly: parsed.data.loanMonthly ?? 0,
        subscriptions_monthly:
          (parsed.data.subscriptionsMonthly ?? 0) + otherMonthly,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("cost_profiles").insert({
      aircraft_id: aircraftId,
      owner_id: user.id,
      hangar_monthly: parsed.data.hangarMonthly ?? 0,
      insurance_monthly: insuranceMonthly,
      annual_estimate: annualEstimateMonthly,
      loan_monthly: parsed.data.loanMonthly ?? 0,
      subscriptions_monthly:
        (parsed.data.subscriptionsMonthly ?? 0) + otherMonthly,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/aircraft/${aircraftId}`);
  redirect(`/dashboard/aircraft/${aircraftId}`);
}
