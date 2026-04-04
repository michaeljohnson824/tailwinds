import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserAircraft } from "@/lib/queries/aircraft";
import { CSVImportWizard } from "@/components/import/csv-import-wizard";

export const metadata: Metadata = { title: "Import Flights — Tailwinds" };

export default async function ImportPage() {
  const aircraft = await getUserAircraft();

  if (aircraft.length === 0) {
    redirect("/dashboard/aircraft/new");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Import Flights</h1>
      <CSVImportWizard aircraft={aircraft} />
    </div>
  );
}
