import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserAircraft } from "@/lib/queries/aircraft";
import { createFlight } from "@/lib/actions/flights";
import { FlightEntryForm } from "@/components/logbook/flight-entry-form";

export const metadata: Metadata = { title: "Log a Flight — Tailwinds" };

export default async function NewFlightPage() {
  const aircraft = await getUserAircraft();

  if (aircraft.length === 0) {
    redirect("/dashboard/aircraft/new");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Log a Flight</h1>
      <FlightEntryForm aircraft={aircraft} action={createFlight} />
    </div>
  );
}
