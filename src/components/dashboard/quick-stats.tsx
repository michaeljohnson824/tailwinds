import { Card, CardContent } from "@/components/ui/card";
import type { FlightStats } from "@/lib/queries/stats";

export function QuickStats({ stats }: { stats: FlightStats }) {
  const items = [
    { label: "Total Hours", value: stats.totalHours.toFixed(1) },
    { label: "Flights This Month", value: String(stats.flightsThisMonth) },
    { label: "Hours This Month", value: stats.hoursThisMonth.toFixed(1) },
    { label: "Hours This Year", value: stats.hoursThisYear.toFixed(1) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
