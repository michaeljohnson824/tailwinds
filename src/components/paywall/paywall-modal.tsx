"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCheckoutMonthly, createCheckoutYearly } from "@/lib/actions/stripe";

export function PaywallModal() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 rounded-full bg-blue-500/10 p-3 w-fit">
            <LockIcon className="h-6 w-6 text-blue-400" />
          </div>
          <CardTitle className="text-xl">Unlock Cost Tracking</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            See your true cost per hour, track expenses, monitor engine health,
            and know exactly what your airplane costs to fly.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Feature text="Full cost-per-hour analytics dashboard" />
            <Feature text="Expense tracking with receipt photos" />
            <Feature text="Engine TBO countdown and oil change tracking" />
            <Feature text="Cost trend charts and category breakdowns" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <form action={createCheckoutMonthly}>
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col">
                <span className="text-lg font-bold">$9</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </Button>
            </form>
            <form action={createCheckoutYearly}>
              <Button className="w-full h-auto py-3 flex flex-col">
                <span className="text-lg font-bold">$89</span>
                <span className="text-xs text-muted-foreground">/year (save 18%)</span>
              </Button>
            </form>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. Your logbook and flight data stay free forever.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 shrink-0">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>{text}</span>
    </div>
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
