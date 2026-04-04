import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AircraftData = {
  id: string;
  tail_number: string;
  make_model: string;
  year: number | null;
  home_airport: string | null;
  hobbs_current: number | string | null;
  tach_current: number | string | null;
};

export function AircraftCard({ aircraft }: { aircraft: AircraftData }) {
  return (
    <Link href={`/dashboard/aircraft/${aircraft.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{aircraft.tail_number}</CardTitle>
            {aircraft.home_airport && (
              <Badge variant="secondary">{aircraft.home_airport}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {aircraft.make_model}
            {aircraft.year ? ` (${aircraft.year})` : ""}
          </p>
          {aircraft.hobbs_current != null && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Hobbs:</span>{" "}
              {Number(aircraft.hobbs_current).toFixed(1)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
