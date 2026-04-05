"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EngineData = {
  id?: string;
  make_model?: string | null;
  tbo_hours?: number | null;
  tsmoh?: number | string | null;
  overhaul_cost_estimate?: number | string | null;
  last_oil_change_tach?: number | string | null;
  oil_change_interval_hours?: number | null;
};

export function EngineForm({
  engine,
  action,
}: {
  engine?: EngineData;
  action: (
    prev: { error: string | null },
    formData: FormData,
  ) => Promise<{ error: string | null }>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  const tbo = engine?.tbo_hours ?? null;
  const overhaulCost = engine?.overhaul_cost_estimate
    ? Number(engine.overhaul_cost_estimate)
    : null;
  const reserveRate =
    tbo && overhaulCost ? (overhaulCost / tbo).toFixed(2) : null;

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="makeModel">Engine Make / Model</Label>
        <Input
          id="makeModel"
          name="makeModel"
          placeholder="Continental O-470-U"
          defaultValue={engine?.make_model ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tboHours">TBO (hours)</Label>
          <Input
            id="tboHours"
            name="tboHours"
            type="number"
            placeholder="2000"
            defaultValue={engine?.tbo_hours ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tsmoh">TSMOH (hours)</Label>
          <Input
            id="tsmoh"
            name="tsmoh"
            type="number"
            step="0.1"
            placeholder="450.0"
            defaultValue={
              engine?.tsmoh != null ? Number(engine.tsmoh) : ""
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="overhaulCostEstimate">Estimated Overhaul Cost ($)</Label>
        <Input
          id="overhaulCostEstimate"
          name="overhaulCostEstimate"
          type="number"
          step="0.01"
          placeholder="35000"
          defaultValue={
            engine?.overhaul_cost_estimate != null
              ? Number(engine.overhaul_cost_estimate)
              : ""
          }
        />
      </div>

      {reserveRate && (
        <p className="text-sm text-muted-foreground">
          Engine reserve rate: <span className="font-medium text-foreground">${reserveRate}/hr</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="lastOilChangeTach">Last Oil Change (tach)</Label>
          <Input
            id="lastOilChangeTach"
            name="lastOilChangeTach"
            type="number"
            step="0.1"
            placeholder="1080.5"
            defaultValue={
              engine?.last_oil_change_tach != null
                ? Number(engine.last_oil_change_tach)
                : ""
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="oilChangeIntervalHours">Oil Change Interval (hrs)</Label>
          <Input
            id="oilChangeIntervalHours"
            name="oilChangeIntervalHours"
            type="number"
            placeholder="50"
            defaultValue={engine?.oil_change_interval_hours ?? 50}
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : engine?.id ? "Update Engine" : "Save Engine"}
      </Button>
    </form>
  );
}
