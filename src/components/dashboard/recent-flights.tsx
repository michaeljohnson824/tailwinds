import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const conditionStyles: Record<string, string> = {
  VFR: "bg-success/15 text-success border-success/30",
  IFR: "bg-primary/15 text-primary border-primary/30",
  SVFR: "bg-warning/15 text-warning border-warning/30",
};

type RecentFlight = {
  id: string;
  date: string;
  route_from: string | null;
  route_to: string | null;
  total_time: number | string | null;
  conditions: string;
  aircraft: unknown;
};

export function RecentFlights({ flights }: { flights: RecentFlight[] }) {
  if (flights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Flights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No flights yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Flights</CardTitle>
        <Link
          href="/dashboard/logbook"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="grid gap-1">
        {flights.map((f) => (
          <Link
            key={f.id}
            href={`/dashboard/logbook/${f.id}`}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
          >
            <span className="shrink-0 text-xs text-muted-foreground w-20">
              {f.date}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {f.route_from ?? "—"}
              {f.route_to ? ` → ${f.route_to}` : ""}
            </span>
            <span className="shrink-0 text-sm tabular-nums">
              {f.total_time != null ? Number(f.total_time).toFixed(1) : "—"}
            </span>
            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] px-1.5 py-0 ${conditionStyles[f.conditions] ?? ""}`}
            >
              {f.conditions}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
