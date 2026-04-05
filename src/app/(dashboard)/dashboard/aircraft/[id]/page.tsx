import { notFound } from "next/navigation";
import Link from "next/link";
import { getAircraft } from "@/lib/queries/aircraft";
import { getEngineByAircraft } from "@/lib/queries/engines";
import { getCostProfile } from "@/lib/queries/cost-profiles";
import { getProfile } from "@/lib/queries/profile";
import { isPaidUser } from "@/lib/utils/subscription";
import { deleteAircraft } from "@/lib/actions/aircraft";
import { createEngine, updateEngine } from "@/lib/actions/engines";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EngineStatus } from "@/components/aircraft/engine-status";
import { EngineSection } from "@/components/aircraft/engine-section";
import { PaidFeatureTeaser } from "@/components/paywall/paid-feature-teaser";

export default async function AircraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [aircraft, engine, costProfile, profile] = await Promise.all([
    getAircraft(id),
    getEngineByAircraft(id),
    getCostProfile(id),
    getProfile(),
  ]);
  const paid = isPaidUser(profile);

  if (!aircraft) notFound();

  // Calculate hours flown since engine was set up
  // We use tach hours flown since the engine's TSMOH baseline was recorded
  const hoursFlownSinceSetup = engine
    ? await getHoursFlownSinceEngineSetup(id, engine.created_at)
    : 0;

  const currentTach = aircraft.tach_current != null
    ? Number(aircraft.tach_current)
    : null;

  async function handleDelete() {
    "use server";
    await deleteAircraft(id);
  }

  const createEngineAction = createEngine.bind(null, id);
  const updateEngineAction = engine
    ? updateEngine.bind(null, engine.id, id)
    : null;

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

      {/* Engine Section — Pilot tier */}
      {paid ? (
        <>
          {engine ? (
            <EngineStatus
              engine={engine}
              currentTach={currentTach}
              hoursFlownSinceSetup={hoursFlownSinceSetup}
            />
          ) : null}
          <EngineSection
            engine={engine}
            createAction={createEngineAction}
            updateAction={updateEngineAction}
          />
        </>
      ) : (
        <PaidFeatureTeaser
          title="Engine Tracking"
          description="Track TBO countdown, oil changes, and engine reserve rate."
        />
      )}

      {/* Cost Profile Link — Pilot tier */}
      {paid ? (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">
                {costProfile ? "Cost Profile" : "Cost Tracking"}
              </p>
              <p className="text-xs text-muted-foreground">
                {costProfile
                  ? `$${totalMonthly(costProfile).toFixed(0)}/mo in fixed costs`
                  : "Set up fixed costs to see your true cost per hour"}
              </p>
            </div>
            <Button
              variant="outline"
              render={<Link href={`/dashboard/aircraft/${id}/costs`} />}
              nativeButton={false}
            >
              {costProfile ? "Edit Cost Profile" : "Set Up Cost Tracking"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PaidFeatureTeaser
          title="Cost Tracking"
          description="See your true cost per hour with fixed cost amortization."
        />
      )}
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

function totalMonthly(cp: {
  hangar_monthly: string | number | null;
  insurance_monthly: string | number | null;
  annual_estimate: string | number | null;
  loan_monthly: string | number | null;
  subscriptions_monthly: string | number | null;
}): number {
  return (
    Number(cp.hangar_monthly ?? 0) +
    Number(cp.insurance_monthly ?? 0) +
    Number(cp.annual_estimate ?? 0) +
    Number(cp.loan_monthly ?? 0) +
    Number(cp.subscriptions_monthly ?? 0)
  );
}

async function getHoursFlownSinceEngineSetup(
  aircraftId: string,
  engineCreatedAt: string,
): Promise<number> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("flights")
    .select("total_time")
    .eq("aircraft_id", aircraftId)
    .gte("created_at", engineCreatedAt);

  return (data ?? []).reduce(
    (sum, f) => sum + (f.total_time ? Number(f.total_time) : 0),
    0,
  );
}
