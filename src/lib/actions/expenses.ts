"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations/expense";

export async function createExpense(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = {
    aircraftId: formData.get("aircraftId") as string,
    category: formData.get("category") as string,
    amount: formData.get("amount") ? Number(formData.get("amount")) : 0,
    date: formData.get("date") as string,
    description: (formData.get("description") as string) || undefined,
    isRecurring: formData.get("isRecurring") === "on",
    recurrenceInterval:
      formData.get("isRecurring") === "on"
        ? (formData.get("recurrenceInterval") as string)
        : null,
    receiptUrl: (formData.get("receiptUrl") as string) || null,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Handle receipt upload if a file was provided
  let receiptUrl: string | null = parsed.data.receiptUrl ?? null;
  const receiptFile = formData.get("receiptFile") as File | null;
  if (receiptFile && receiptFile.size > 0) {
    const ext = receiptFile.name.split(".").pop() ?? "jpg";
    const path = `receipts/${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, receiptFile);
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(path);
      receiptUrl = urlData.publicUrl;
    }
  }

  const { error } = await supabase.from("expenses").insert({
    aircraft_id: parsed.data.aircraftId,
    recorded_by: user.id,
    category: parsed.data.category,
    amount: parsed.data.amount,
    date: parsed.data.date,
    description: parsed.data.description ?? null,
    is_recurring: parsed.data.isRecurring,
    recurrence_interval: parsed.data.recurrenceInterval ?? null,
    receipt_url: receiptUrl,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/costs");
  return { error: null };
}

export async function updateExpense(
  id: string,
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = {
    aircraftId: formData.get("aircraftId") as string,
    category: formData.get("category") as string,
    amount: formData.get("amount") ? Number(formData.get("amount")) : 0,
    date: formData.get("date") as string,
    description: (formData.get("description") as string) || undefined,
    isRecurring: formData.get("isRecurring") === "on",
    recurrenceInterval:
      formData.get("isRecurring") === "on"
        ? (formData.get("recurrenceInterval") as string)
        : null,
    receiptUrl: (formData.get("receiptUrl") as string) || null,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let receiptUrl: string | null = parsed.data.receiptUrl ?? null;
  const receiptFile = formData.get("receiptFile") as File | null;
  if (receiptFile && receiptFile.size > 0) {
    const ext = receiptFile.name.split(".").pop() ?? "jpg";
    const path = `receipts/${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, receiptFile);
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(path);
      receiptUrl = urlData.publicUrl;
    }
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      aircraft_id: parsed.data.aircraftId,
      category: parsed.data.category,
      amount: parsed.data.amount,
      date: parsed.data.date,
      description: parsed.data.description ?? null,
      is_recurring: parsed.data.isRecurring,
      recurrence_interval: parsed.data.recurrenceInterval ?? null,
      receipt_url: receiptUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("recorded_by", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/costs");
  return { error: null };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("recorded_by", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/costs");
  return { error: null };
}
