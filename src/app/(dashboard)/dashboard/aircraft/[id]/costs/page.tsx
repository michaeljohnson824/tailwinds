import { notFound } from "next/navigation";
import Link from "next/link";
import { getAircraft } from "@/lib/queries/aircraft";
import { getCostProfile, getTrailing12MonthHours } from "@/lib/queries/cost-profiles";
import { createCostProfile } from "@/lib/actions/cost-profiles";
import { CostSetupWizard } from "@/components/aircraft/cost-setup-wizard";

export default async function CostSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [aircraft, costProfile, trailing] = await Promise.all([
    getAircraft(id),
    getCostProfile(id),
    getTrailing12MonthHours(id),
  ]);

  if (!aircraft) notFound();

  const action = createCostProfile.bind(null, id);

  // Convert stored monthly values back to annual for the form
  const initialData = costProfile
    ? {
        hangarMonthly: Number(costProfile.hangar_monthly ?? 0),
        insuranceAnnual: Number(costProfile.insurance_monthly ?? 0) * 12,
        annualEstimate: Number(costProfile.annual_estimate ?? 0) * 12,
        loanMonthly: Number(costProfile.loan_monthly ?? 0),
        subscriptionsMonthly: Number(costProfile.subscriptions_monthly ?? 0),
        otherAnnual: 0,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/aircraft/${id}`}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Cost Profile</h1>
          <p className="text-sm text-muted-foreground">{aircraft.tail_number} — {aircraft.make_model}</p>
        </div>
      </div>

      <CostSetupWizard
        action={action}
        initialData={initialData}
        trailing12MonthHours={trailing.totalHours}
        hasEnoughData={trailing.flightCount >= 1}
        isEditing={!!costProfile}
      />
    </div>
  );
}
