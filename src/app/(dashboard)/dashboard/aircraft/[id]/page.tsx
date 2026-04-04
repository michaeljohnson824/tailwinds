import { notFound } from "next/navigation";
import Link from "next/link";
import { getAircraft } from "@/lib/queries/aircraft";
import { deleteAircraft } from "@/lib/actions/aircraft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function AircraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aircraft = await getAircraft(id);

  if (!aircraft) notFound();

  async function handleDelete() {
    "use server";
    await deleteAircraft(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/aircraft"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">{aircraft.tail_number}</h1>
          {aircraft.home_airport && (
            <Badge variant="secondary">{aircraft.home_airport}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/dashboard/aircraft/${id}/edit`} />} nativeButton={false}>
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
          <CardTitle>Aircraft Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="Make / Model" value={aircraft.make_model} />
            <InfoItem label="Year" value={aircraft.year?.toString() ?? "—"} />
            <InfoItem label="Home Airport" value={aircraft.home_airport ?? "—"} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <InfoItem
              label="Hobbs"
              value={aircraft.hobbs_current != null ? Number(aircraft.hobbs_current).toFixed(1) : "—"}
            />
            <InfoItem
              label="Tach"
              value={aircraft.tach_current != null ? Number(aircraft.tach_current).toFixed(1) : "—"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
