import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getUserFlights } from "@/lib/queries/flights";
import { getUserAircraft } from "@/lib/queries/aircraft";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LogbookFilters } from "@/components/logbook/logbook-filters";

const conditionStyles: Record<string, string> = {
  VFR: "bg-success/15 text-success border-success/30",
  IFR: "bg-primary/15 text-primary border-primary/30",
  SVFR: "bg-warning/15 text-warning border-warning/30",
};

export const metadata: Metadata = { title: "Logbook — Tailwinds" };

export default async function LogbookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const [flights, aircraft] = await Promise.all([
    getUserFlights({
      aircraftId: params.aircraft,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      search: params.search,
    }),
    getUserAircraft(),
  ]);

  // Running totals
  const totalFlights = flights.length;
  const totalHours = flights.reduce(
    (sum, f) => sum + (f.total_time != null ? Number(f.total_time) : 0),
    0
  );
  const totalLandings = flights.reduce(
    (sum, f) => sum + (f.landings_day ?? 0) + (f.landings_night ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logbook</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href="/dashboard/import" />}
            nativeButton={false}
            className="hidden sm:inline-flex"
          >
            Import
          </Button>
          <Button
            variant="outline"
            render={<a href="/api/export" download />}
            nativeButton={false}
            className="hidden sm:inline-flex"
          >
            Export
          </Button>
          <Button
            render={<Link href="/dashboard/logbook/new" />}
            nativeButton={false}
          >
            <span className="sm:hidden">+ Flight</span>
            <span className="hidden sm:inline">Log a Flight</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <LogbookFilters aircraft={aircraft} />
      </Suspense>

      {flights.length === 0 && !params.search && !params.aircraft && !params.dateFrom ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <BookIcon className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-medium">No flights logged yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Log your first flight to start building your logbook.
          </p>
          <Button
            render={<Link href="/dashboard/logbook/new" />}
            nativeButton={false}
            className="mt-4"
          >
            Log a Flight
          </Button>
        </div>
      ) : (
        <>
          {/* Running totals */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold">{totalFlights}</p>
                <p className="text-xs text-muted-foreground">Flights</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold">{totalLandings}</p>
                <p className="text-xs text-muted-foreground">Landings</p>
              </CardContent>
            </Card>
          </div>

          {flights.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No flights match your filters.
            </p>
          ) : (
            /* Flight list */
            <div className="space-y-1.5">
              {flights.map((f) => {
                const tail =
                  f.aircraft &&
                  typeof f.aircraft === "object" &&
                  "tail_number" in f.aircraft
                    ? (f.aircraft as { tail_number: string }).tail_number
                    : "";
                const landings = (f.landings_day ?? 0) + (f.landings_night ?? 0);

                return (
                  <Link
                    key={f.id}
                    href={`/dashboard/logbook/${f.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                  >
                    {/* Date */}
                    <span className="shrink-0 text-xs text-muted-foreground w-20 hidden sm:block">
                      {f.date}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground sm:hidden">
                      {f.date?.slice(5)}
                    </span>

                    {/* Route */}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {f.route_from ?? "—"}
                      {f.route_to ? ` → ${f.route_to}` : ""}
                    </span>

                    {/* Tail number */}
                    {tail && (
                      <span className="shrink-0 text-xs text-muted-foreground hidden md:block">
                        {tail}
                      </span>
                    )}

                    {/* Total time */}
                    <span className="shrink-0 text-sm tabular-nums w-12 text-right">
                      {f.total_time != null
                        ? Number(f.total_time).toFixed(1)
                        : "—"}
                    </span>

                    {/* Landings */}
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums w-6 text-right hidden sm:block">
                      {landings}
                    </span>

                    {/* Conditions badge */}
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] px-1.5 py-0 ${conditionStyles[f.conditions] ?? ""}`}
                    >
                      {f.conditions}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}
