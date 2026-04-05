import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EngineData = {
  id: string;
  make_model: string | null;
  tbo_hours: number | null;
  tsmoh: number | string | null;
  overhaul_cost_estimate: number | string | null;
  last_oil_change_tach: number | string | null;
  oil_change_interval_hours: number | null;
};

function statusColor(pctRemaining: number): string {
  if (pctRemaining >= 0.4) return "text-emerald-400";
  if (pctRemaining >= 0.2) return "text-yellow-400";
  return "text-red-400";
}

function barColor(pctRemaining: number): string {
  if (pctRemaining >= 0.4) return "bg-emerald-500";
  if (pctRemaining >= 0.2) return "bg-yellow-500";
  return "bg-red-500";
}

function ProgressBar({
  value,
  max,
  label,
  sublabel,
}: {
  value: number;
  max: number;
  label: string;
  sublabel: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const color = barColor(pct);
  const textColor = statusColor(pct);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${textColor}`}>{sublabel}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

export function EngineStatus({
  engine,
  currentTach,
  hoursFlownSinceSetup,
}: {
  engine: EngineData;
  currentTach: number | null;
  hoursFlownSinceSetup: number;
}) {
  const tsmoh = engine.tsmoh != null ? Number(engine.tsmoh) : null;
  const tbo = engine.tbo_hours;
  const overhaulCost =
    engine.overhaul_cost_estimate != null
      ? Number(engine.overhaul_cost_estimate)
      : null;
  const lastOilTach =
    engine.last_oil_change_tach != null
      ? Number(engine.last_oil_change_tach)
      : null;
  const oilInterval = engine.oil_change_interval_hours ?? 50;

  // Calculate current TSMOH based on hours flown since engine was set up
  const currentTsmoh = tsmoh != null ? tsmoh + hoursFlownSinceSetup : null;
  const hoursRemaining =
    tbo != null && currentTsmoh != null ? tbo - currentTsmoh : null;
  const pctRemaining =
    tbo != null && currentTsmoh != null && tbo > 0
      ? (tbo - currentTsmoh) / tbo
      : null;

  // Engine reserve rate
  const reserveRate =
    tbo != null && overhaulCost != null && tbo > 0
      ? overhaulCost / tbo
      : null;

  // Oil change calculation
  const hoursSinceOil =
    lastOilTach != null && currentTach != null
      ? currentTach - lastOilTach
      : null;
  const oilPctRemaining =
    hoursSinceOil != null && oilInterval > 0
      ? Math.max(0, (oilInterval - hoursSinceOil) / oilInterval)
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Engine</span>
          {engine.make_model && (
            <span className="text-sm font-normal text-muted-foreground">
              {engine.make_model}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TBO Progress */}
        {tbo != null && currentTsmoh != null && hoursRemaining != null && pctRemaining != null && (
          <ProgressBar
            value={Math.max(0, hoursRemaining)}
            max={tbo}
            label="Time to Overhaul"
            sublabel={`${hoursRemaining.toFixed(1)} hrs remaining`}
          />
        )}

        {/* TSMOH display */}
        {currentTsmoh != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">TSMOH</span>
            <span className="font-medium">{currentTsmoh.toFixed(1)} hrs</span>
          </div>
        )}

        {/* Oil Change Status */}
        {hoursSinceOil != null && oilPctRemaining != null && (
          <ProgressBar
            value={Math.max(0, oilInterval - hoursSinceOil)}
            max={oilInterval}
            label="Oil Change"
            sublabel={`${Math.max(0, oilInterval - hoursSinceOil).toFixed(1)} hrs remaining`}
          />
        )}

        {/* Reserve Rate */}
        {reserveRate != null && (
          <div className="flex items-center justify-between text-sm border-t border-border pt-3">
            <span className="text-muted-foreground">Engine Reserve Rate</span>
            <span className="font-medium">${reserveRate.toFixed(2)}/hr</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
