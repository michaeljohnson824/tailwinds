import type { Metadata } from "next";
import Link from "next/link";
import { getUserAircraft } from "@/lib/queries/aircraft";
import { AircraftCard } from "@/components/aircraft/aircraft-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Aircraft — Tailwinds" };

export default async function AircraftListPage() {
  const aircraft = await getUserAircraft();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aircraft</h1>
        <Button render={<Link href="/dashboard/aircraft/new" />}>
          Add Aircraft
        </Button>
      </div>

      {aircraft.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <PlaneIcon className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-medium">No aircraft yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first aircraft to start logging flights.
          </p>
          <Button render={<Link href="/dashboard/aircraft/new" />} className="mt-4">
            Add Aircraft
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aircraft.map((a) => (
            <AircraftCard key={a.id} aircraft={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}
