import type { Metadata } from "next";
import { createAircraft } from "@/lib/actions/aircraft";
import { AircraftForm } from "@/components/aircraft/aircraft-form";

export const metadata: Metadata = { title: "Add Aircraft — Tailwinds" };

export default function NewAircraftPage() {
  async function action(_prev: { error: string | null }, formData: FormData) {
    "use server";
    const result = await createAircraft(formData);
    // If createAircraft succeeds it redirects, so we only get here on error
    return { error: result?.error ?? null };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Aircraft</h1>
      <AircraftForm action={action} title="Aircraft Details" />
    </div>
  );
}
