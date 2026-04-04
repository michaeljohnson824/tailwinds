import { notFound } from "next/navigation";
import Link from "next/link";
import { getFlight } from "@/lib/queries/flights";
import { deleteFlight } from "@/lib/actions/flights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flight = await getFlight(id);

  if (!flight) notFound();

  async function handleDelete() {
    "use server";
    await deleteFlight(id);
  }

  const tail =
    flight.aircraft && typeof flight.aircraft === "object" && "tail_number" in flight.aircraft
      ? (flight.aircraft as { tail_number: string }).tail_number
      : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/logbook"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">
            {flight.route_from ?? "—"}
            {flight.route_to ? ` → ${flight.route_to}` : ""}
          </h1>
          <Badge variant="secondary">{flight.conditions}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/dashboard/logbook/${id}/edit`} />} nativeButton={false}>
            Edit
          </Button>
          <form action={handleDelete}>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flight Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="Date" value={flight.date} />
            <Info label="Aircraft" value={tail} />
            <Info label="Route" value={[flight.route_from, flight.route_via, flight.route_to].filter(Boolean).join(" → ")} />
            <Info label="Conditions" value={flight.conditions} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="Hobbs Start" value={fmt(flight.hobbs_start)} />
            <Info label="Hobbs End" value={fmt(flight.hobbs_end)} />
            <Info label="Total Time" value={fmt(flight.total_time)} />
            <Info label="Tach Start / End" value={`${fmt(flight.tach_start)} / ${fmt(flight.tach_end)}`} />
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            <Info label="Day Ldg" value={String(flight.landings_day)} />
            <Info label="Night Ldg" value={String(flight.landings_night)} />
            <Info label="Night" value={fmt(flight.night_time)} />
            <Info label="Inst" value={fmt(flight.instrument_time)} />
            <Info label="Appr" value={String(flight.instrument_approaches)} />
            <Info label="XC" value={flight.cross_country ? "Yes" : "No"} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="PIC" value={fmt(flight.pic_time)} />
            <Info label="SIC" value={fmt(flight.sic_time)} />
            <Info label="Dual Given" value={fmt(flight.dual_given)} />
            <Info label="Dual Received" value={fmt(flight.dual_received)} />
          </div>
          {(flight.fuel_gallons != null || flight.remarks) && <Separator />}
          {flight.fuel_gallons != null && (
            <div className="grid grid-cols-3 gap-4">
              <Info label="Fuel (gal)" value={fmt(flight.fuel_gallons)} />
              <Info label="Price/gal" value={flight.fuel_price_per_gallon != null ? `$${Number(flight.fuel_price_per_gallon).toFixed(2)}` : "—"} />
              <Info label="Fuel Cost" value={flight.fuel_total_cost != null ? `$${Number(flight.fuel_total_cost).toFixed(2)}` : "—"} />
            </div>
          )}
          {flight.remarks && (
            <div>
              <p className="text-xs text-muted-foreground">Remarks</p>
              <p className="text-sm whitespace-pre-wrap">{flight.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function fmt(val: number | string | null | undefined): string {
  if (val == null) return "—";
  return Number(val).toFixed(1);
}
