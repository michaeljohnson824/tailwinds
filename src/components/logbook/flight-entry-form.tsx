"use client";

import { useActionState, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type AircraftOption = {
  id: string;
  tail_number: string;
  hobbs_current: number | string | null;
  tach_current: number | string | null;
};

type FlightData = {
  id?: string;
  aircraft_id?: string;
  date?: string;
  route_from?: string | null;
  route_to?: string | null;
  route_via?: string | null;
  hobbs_start?: number | string | null;
  hobbs_end?: number | string | null;
  tach_start?: number | string | null;
  tach_end?: number | string | null;
  total_time?: number | string | null;
  landings_day?: number | null;
  landings_night?: number | null;
  conditions?: string | null;
  night_time?: number | string | null;
  instrument_time?: number | string | null;
  instrument_approaches?: number | null;
  cross_country?: boolean | null;
  pic_time?: number | string | null;
  sic_time?: number | string | null;
  dual_given?: number | string | null;
  dual_received?: number | string | null;
  fuel_gallons?: number | string | null;
  fuel_price_per_gallon?: number | string | null;
  remarks?: string | null;
};

export function FlightEntryForm({
  aircraft,
  flight,
  action,
}: {
  aircraft: AircraftOption[];
  flight?: FlightData;
  action: (
    prev: { error: string | null },
    formData: FormData
  ) => Promise<{ error: string | null }>;
}) {
  const isEdit = !!flight;
  const [state, formAction, pending] = useActionState(action, { error: null });

  // Determine initial aircraft
  const initialAircraftId =
    flight?.aircraft_id ?? (aircraft.length === 1 ? aircraft[0].id : "");
  const initialAircraft = aircraft.find((a) => a.id === initialAircraftId);

  // Controlled state for auto-compute
  const [selectedAircraftId, setSelectedAircraftId] = useState(initialAircraftId);
  const [hobbsStart, setHobbsStart] = useState(
    flight?.hobbs_start != null
      ? String(flight.hobbs_start)
      : initialAircraft?.hobbs_current != null
        ? String(initialAircraft.hobbs_current)
        : ""
  );
  const [hobbsEnd, setHobbsEnd] = useState(
    flight?.hobbs_end != null ? String(flight.hobbs_end) : ""
  );
  const [tachStart, setTachStart] = useState(
    flight?.tach_start != null
      ? String(flight.tach_start)
      : initialAircraft?.tach_current != null
        ? String(initialAircraft.tach_current)
        : ""
  );
  const [tachEnd, setTachEnd] = useState(
    flight?.tach_end != null ? String(flight.tach_end) : ""
  );
  const [picTime, setPicTime] = useState(
    flight?.pic_time != null ? String(flight.pic_time) : ""
  );
  const [detailsOpen, setDetailsOpen] = useState(isEdit);
  const [fuelOpen, setFuelOpen] = useState(
    isEdit && (flight?.fuel_gallons != null)
  );

  // Auto-compute total time
  const totalTime = useCallback(() => {
    const s = parseFloat(hobbsStart);
    const e = parseFloat(hobbsEnd);
    if (!isNaN(s) && !isNaN(e) && e > s) {
      return (Math.round((e - s) * 10) / 10).toFixed(1);
    }
    return "";
  }, [hobbsStart, hobbsEnd]);

  const computedTotal = totalTime();

  // When hobbs end changes and PIC hasn't been manually set, sync PIC to total
  useEffect(() => {
    if (!isEdit && computedTotal) {
      setPicTime(computedTotal);
    }
  }, [computedTotal, isEdit]);

  // When aircraft selection changes, auto-fill hobbs/tach from that aircraft
  function handleAircraftChange(id: string) {
    setSelectedAircraftId(id);
    if (!isEdit) {
      const ac = aircraft.find((a) => a.id === id);
      if (ac) {
        if (ac.hobbs_current != null) setHobbsStart(String(ac.hobbs_current));
        if (ac.tach_current != null) setTachStart(String(ac.tach_current));
      }
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="pt-6">
        <form action={formAction} className="grid gap-4">
          {/* Date & Aircraft */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={flight?.date ?? today}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="aircraftId">Aircraft</Label>
              <select
                id="aircraftId"
                name="aircraftId"
                value={selectedAircraftId}
                onChange={(e) => handleAircraftChange(e.target.value)}
                required
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="" disabled>
                  Select aircraft
                </option>
                {aircraft.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tail_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="routeFrom">From</Label>
              <Input
                id="routeFrom"
                name="routeFrom"
                placeholder="KSNA"
                maxLength={4}
                defaultValue={flight?.route_from ?? ""}
                required
                className="uppercase"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="routeTo">To</Label>
              <Input
                id="routeTo"
                name="routeTo"
                placeholder="KSBA"
                maxLength={4}
                defaultValue={flight?.route_to ?? ""}
                className="uppercase"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </div>
            <div className="col-span-1 grid gap-2">
              <Label htmlFor="routeVia">Via</Label>
              <Input
                id="routeVia"
                name="routeVia"
                placeholder="VNY"
                defaultValue={flight?.route_via ?? ""}
                className="uppercase text-xs"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </div>
          </div>

          {/* Hobbs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="hobbsStart">Hobbs Start</Label>
              <Input
                id="hobbsStart"
                name="hobbsStart"
                type="number"
                step="0.1"
                placeholder="1234.5"
                value={hobbsStart}
                onChange={(e) => setHobbsStart(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hobbsEnd">Hobbs End</Label>
              <Input
                id="hobbsEnd"
                name="hobbsEnd"
                type="number"
                step="0.1"
                placeholder="1236.0"
                value={hobbsEnd}
                onChange={(e) => setHobbsEnd(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Total Time</Label>
              <Input
                name="totalTime"
                type="number"
                step="0.1"
                value={computedTotal}
                readOnly
                tabIndex={-1}
                className="bg-muted/50"
              />
            </div>
          </div>

          {/* Tach */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tachStart">Tach Start</Label>
              <Input
                id="tachStart"
                name="tachStart"
                type="number"
                step="0.1"
                placeholder="1100.2"
                value={tachStart}
                onChange={(e) => setTachStart(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tachEnd">Tach End</Label>
              <Input
                id="tachEnd"
                name="tachEnd"
                type="number"
                step="0.1"
                placeholder="1101.5"
                value={tachEnd}
                onChange={(e) => setTachEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Landings & Conditions */}
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="landingsDay">Day Landings</Label>
              <Input
                id="landingsDay"
                name="landingsDay"
                type="number"
                min="0"
                defaultValue={flight?.landings_day ?? 1}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="landingsNight">Night Landings</Label>
              <Input
                id="landingsNight"
                name="landingsNight"
                type="number"
                min="0"
                defaultValue={flight?.landings_night ?? 0}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conditions">Conditions</Label>
              <select
                id="conditions"
                name="conditions"
                defaultValue={flight?.conditions ?? "VFR"}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="VFR">VFR</option>
                <option value="IFR">IFR</option>
                <option value="SVFR">SVFR</option>
              </select>
            </div>
          </div>

          {/* Details — collapsible */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
              Details
              <ChevronIcon open={detailsOpen} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-4 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nightTime">Night Time</Label>
                    <Input
                      id="nightTime"
                      name="nightTime"
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={flight?.night_time ?? 0}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instrumentTime">Instrument Time</Label>
                    <Input
                      id="instrumentTime"
                      name="instrumentTime"
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={flight?.instrument_time ?? 0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="instrumentApproaches">Approaches</Label>
                    <Input
                      id="instrumentApproaches"
                      name="instrumentApproaches"
                      type="number"
                      min="0"
                      defaultValue={flight?.instrument_approaches ?? 0}
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <input
                      id="crossCountry"
                      name="crossCountry"
                      type="checkbox"
                      defaultChecked={flight?.cross_country ?? false}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor="crossCountry" className="text-sm">
                      Cross-Country
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="picTime">PIC</Label>
                    <Input
                      id="picTime"
                      name="picTime"
                      type="number"
                      step="0.1"
                      min="0"
                      value={picTime}
                      onChange={(e) => setPicTime(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sicTime">SIC</Label>
                    <Input
                      id="sicTime"
                      name="sicTime"
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={flight?.sic_time ?? 0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dualGiven">Dual Given</Label>
                    <Input
                      id="dualGiven"
                      name="dualGiven"
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={flight?.dual_given ?? 0}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dualReceived">Dual Received</Label>
                    <Input
                      id="dualReceived"
                      name="dualReceived"
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={flight?.dual_received ?? 0}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Fuel — collapsible */}
          <Collapsible open={fuelOpen} onOpenChange={setFuelOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
              Fuel
              <ChevronIcon open={fuelOpen} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="grid gap-2">
                  <Label htmlFor="fuelGallons">Gallons</Label>
                  <Input
                    id="fuelGallons"
                    name="fuelGallons"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="40.0"
                    defaultValue={flight?.fuel_gallons ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fuelPricePerGallon">Price/gal ($)</Label>
                  <Input
                    id="fuelPricePerGallon"
                    name="fuelPricePerGallon"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="6.50"
                    defaultValue={flight?.fuel_price_per_gallon ?? ""}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Remarks */}
          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              name="remarks"
              placeholder="Flight notes..."
              rows={2}
              defaultValue={flight?.remarks ?? ""}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              render={<Link href={isEdit ? `/dashboard/logbook/${flight?.id}` : "/dashboard/logbook"} />}
              nativeButton={false}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Saving..." : isEdit ? "Update Flight" : "Log Flight"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
