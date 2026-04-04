import { notFound } from "next/navigation";
import { getAircraft } from "@/lib/queries/aircraft";
import { updateAircraft } from "@/lib/actions/aircraft";
import { AircraftForm } from "@/components/aircraft/aircraft-form";

export default async function EditAircraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aircraft = await getAircraft(id);

  if (!aircraft) notFound();

  async function action(_prev: { error: string | null }, formData: FormData) {
    "use server";
    const result = await updateAircraft(id, formData);
    return { error: result?.error ?? null };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit {aircraft.tail_number}</h1>
      <AircraftForm aircraft={aircraft} action={action} title="Aircraft Details" />
    </div>
  );
}
