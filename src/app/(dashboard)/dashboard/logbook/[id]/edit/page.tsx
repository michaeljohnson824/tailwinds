import { notFound, redirect } from "next/navigation";
import { getFlight } from "@/lib/queries/flights";
import { getUserAircraft } from "@/lib/queries/aircraft";
import { updateFlight } from "@/lib/actions/flights";
import { FlightEntryForm } from "@/components/logbook/flight-entry-form";

export default async function EditFlightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [flight, aircraft] = await Promise.all([
    getFlight(id),
    getUserAircraft(),
  ]);

  if (!flight) notFound();
  if (aircraft.length === 0) redirect("/dashboard/aircraft/new");

  const action = updateFlight.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Flight</h1>
      <FlightEntryForm aircraft={aircraft} flight={flight} action={action} />
    </div>
  );
}
