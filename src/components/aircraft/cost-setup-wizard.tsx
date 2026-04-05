"use client";

import { useState, useActionState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type CostData = {
  hangarMonthly: number;
  insuranceAnnual: number;
  annualEstimate: number;
  loanMonthly: number;
  subscriptionsMonthly: number;
  otherAnnual: number;
};

export function CostSetupWizard({
  action,
  initialData,
  trailing12MonthHours,
  hasEnoughData,
  isEditing,
}: {
  action: (
    prev: { error: string | null },
    formData: FormData,
  ) => Promise<{ error: string | null }>;
  initialData?: CostData;
  trailing12MonthHours: number;
  hasEnoughData: boolean;
  isEditing: boolean;
}) {
  const [step, setStep] = useState(1);
  const [costs, setCosts] = useState<CostData>(
    initialData ?? {
      hangarMonthly: 0,
      insuranceAnnual: 0,
      annualEstimate: 0,
      loanMonthly: 0,
      subscriptionsMonthly: 0,
      otherAnnual: 0,
    },
  );
  const [estimatedAnnualHours, setEstimatedAnnualHours] = useState(100);

  const [state, formAction, pending] = useActionState(action, { error: null });

  const monthlyTotal = useMemo(() => {
    return (
      costs.hangarMonthly +
      costs.insuranceAnnual / 12 +
      costs.annualEstimate / 12 +
      costs.loanMonthly +
      costs.subscriptionsMonthly +
      costs.otherAnnual / 12
    );
  }, [costs]);

  const annualTotal = monthlyTotal * 12;

  const hoursForCalc =
    hasEnoughData && trailing12MonthHours > 0
      ? trailing12MonthHours
      : estimatedAnnualHours;

  const costPerHour = hoursForCalc > 0 ? annualTotal / hoursForCalc : 0;

  function updateCost(field: keyof CostData, value: string) {
    const num = value === "" ? 0 : Number(value);
    if (!isNaN(num)) {
      setCosts((prev) => ({ ...prev, [field]: num }));
    }
  }

  if (step === 1) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Step 1: Fixed Costs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your recurring aircraft costs. Leave blank for items that don't apply.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <CostInput
            label="Monthly Hangar / Tiedown"
            id="hangarMonthly"
            value={costs.hangarMonthly}
            onChange={(v) => updateCost("hangarMonthly", v)}
            period="mo"
          />
          <CostInput
            label="Annual Insurance"
            id="insuranceAnnual"
            value={costs.insuranceAnnual}
            onChange={(v) => updateCost("insuranceAnnual", v)}
            period="yr"
          />
          <CostInput
            label="Annual Inspection Estimate"
            id="annualEstimate"
            value={costs.annualEstimate}
            onChange={(v) => updateCost("annualEstimate", v)}
            period="yr"
          />
          <CostInput
            label="Monthly Loan / Financing"
            id="loanMonthly"
            value={costs.loanMonthly}
            onChange={(v) => updateCost("loanMonthly", v)}
            period="mo"
          />
          <CostInput
            label="Monthly Subscriptions"
            id="subscriptionsMonthly"
            value={costs.subscriptionsMonthly}
            onChange={(v) => updateCost("subscriptionsMonthly", v)}
            period="mo"
            hint="ForeFlight, databases, etc."
          />
          <CostInput
            label="Other Annual Fixed Costs"
            id="otherAnnual"
            value={costs.otherAnnual}
            onChange={(v) => updateCost("otherAnnual", v)}
            period="yr"
            hint="State registration, taxes, etc."
          />

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly total</span>
            <span className="font-medium">${monthlyTotal.toFixed(0)}/mo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Annual total</span>
            <span className="font-medium">${annualTotal.toFixed(0)}/yr</span>
          </div>

          <Button
            onClick={() => setStep(2)}
            className="w-full"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Confirmation
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Step 2: Confirm & Save</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <SummaryRow label="Hangar / Tiedown" value={`$${costs.hangarMonthly.toFixed(0)}/mo`} />
          <SummaryRow label="Insurance" value={`$${costs.insuranceAnnual.toFixed(0)}/yr`} />
          <SummaryRow label="Annual Inspection" value={`$${costs.annualEstimate.toFixed(0)}/yr`} />
          <SummaryRow label="Loan / Financing" value={`$${costs.loanMonthly.toFixed(0)}/mo`} />
          <SummaryRow label="Subscriptions" value={`$${costs.subscriptionsMonthly.toFixed(0)}/mo`} />
          {costs.otherAnnual > 0 && (
            <SummaryRow label="Other Annual" value={`$${costs.otherAnnual.toFixed(0)}/yr`} />
          )}
          <Separator />
          <SummaryRow label="Total Fixed Costs" value={`$${annualTotal.toFixed(0)}/yr`} bold />
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Estimated Fixed Cost Per Hour</p>
          {hasEnoughData && trailing12MonthHours > 0 ? (
            <p className="text-xs text-muted-foreground">
              Based on {trailing12MonthHours.toFixed(1)} hours flown in the last 12 months
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {hasEnoughData
                  ? "No flight hours recorded in the last 12 months."
                  : "Not enough flight data yet."}{" "}
                Enter your estimated annual hours:
              </p>
              <Input
                type="number"
                value={estimatedAnnualHours}
                onChange={(e) =>
                  setEstimatedAnnualHours(
                    Math.max(1, Number(e.target.value) || 1),
                  )
                }
                className="w-32"
              />
            </div>
          )}
          <p className="text-2xl font-bold">
            ${costPerHour.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">/hr (fixed only)</span>
          </p>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <form action={formAction} className="flex-1">
            <input type="hidden" name="hangarMonthly" value={costs.hangarMonthly} />
            <input type="hidden" name="insuranceAnnual" value={costs.insuranceAnnual} />
            <input type="hidden" name="annualEstimate" value={costs.annualEstimate} />
            <input type="hidden" name="loanMonthly" value={costs.loanMonthly} />
            <input type="hidden" name="subscriptionsMonthly" value={costs.subscriptionsMonthly} />
            <input type="hidden" name="otherAnnual" value={costs.otherAnnual} />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving..." : isEditing ? "Update Cost Profile" : "Save Cost Profile"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function CostInput({
  label,
  id,
  value,
  onChange,
  period,
  hint,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (value: string) => void;
  period: "mo" | "yr";
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
          id={id}
          type="number"
          step="0.01"
          min="0"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground">/{period}</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
