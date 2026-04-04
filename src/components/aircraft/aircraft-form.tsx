"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AircraftData = {
  id?: string;
  tail_number?: string;
  make_model?: string;
  year?: number | null;
  home_airport?: string | null;
  hobbs_current?: number | string | null;
  tach_current?: number | string | null;
};

export function AircraftForm({
  aircraft,
  action,
  title,
}: {
  aircraft?: AircraftData;
  action: (prev: { error: string | null }, formData: FormData) => Promise<{ error: string | null }>;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tailNumber">Tail Number</Label>
            <Input
              id="tailNumber"
              name="tailNumber"
              placeholder="N12345"
              defaultValue={aircraft?.tail_number ?? ""}
              required
              className="uppercase"
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="makeModel">Make / Model</Label>
            <Input
              id="makeModel"
              name="makeModel"
              placeholder="Cessna 182P"
              defaultValue={aircraft?.make_model ?? ""}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                type="number"
                placeholder="1975"
                defaultValue={aircraft?.year ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="homeAirport">Home Airport</Label>
              <Input
                id="homeAirport"
                name="homeAirport"
                placeholder="KSNA"
                maxLength={4}
                defaultValue={aircraft?.home_airport ?? ""}
                className="uppercase"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="hobbsCurrent">Current Hobbs</Label>
              <Input
                id="hobbsCurrent"
                name="hobbsCurrent"
                type="number"
                step="0.1"
                placeholder="1234.5"
                defaultValue={aircraft?.hobbs_current ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tachCurrent">Current Tach</Label>
              <Input
                id="tachCurrent"
                name="tachCurrent"
                type="number"
                step="0.1"
                placeholder="1100.2"
                defaultValue={aircraft?.tach_current ?? ""}
              />
            </div>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : "Save Aircraft"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
