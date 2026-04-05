import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function CostTeaser({
  state,
  costPerHour,
  fuelPerHour,
  aircraftId,
}: {
  state: "full" | "fuel-only" | "none";
  costPerHour?: number;
  fuelPerHour?: number;
  aircraftId?: string;
}) {
  if (state === "full" && costPerHour != null) {
    return (
      <Link href="/dashboard/costs">
        <Card className="transition-colors hover:bg-accent/50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Cost Per Hour</p>
              <LockIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tabular-nums">
                ${costPerHour.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">/hr</span>
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (state === "fuel-only" && fuelPerHour != null) {
    const setupUrl = aircraftId
      ? `/dashboard/aircraft/${aircraftId}/costs`
      : "/dashboard/aircraft";
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">
              Fuel Cost: ${fuelPerHour.toFixed(2)}/hr
            </p>
            <Link
              href={setupUrl}
              className="text-xs text-primary hover:underline"
            >
              Set up full cost tracking &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // state === "none"
  const setupUrl = aircraftId
    ? `/dashboard/aircraft/${aircraftId}/costs`
    : "/dashboard/aircraft";
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm font-medium">Track Your True Cost Per Hour</p>
          <p className="text-xs text-muted-foreground">
            See what your airplane actually costs to fly.
          </p>
        </div>
        <Link
          href={setupUrl}
          className="text-sm text-primary hover:underline whitespace-nowrap"
        >
          Get Started &rarr;
        </Link>
      </CardContent>
    </Card>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
