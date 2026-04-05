"use client";

import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  type PieLabelRenderProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type CategoryBreakdown,
  type MonthlyTrend,
  PIE_COLORS,
} from "@/lib/utils/costs";

type CostData = {
  totalCostPerHour: number;
  fixedPerHour: number;
  fuelPerHour: number;
  maintenancePerHour: number;
  reservePerHour: number;
  totalHours: number;
  annualFixed: number;
};

type Aircraft = {
  id: string;
  tail_number: string;
} | null;

export function CostDashboardClient({
  aircraft,
  costData,
  breakdown,
  trend,
  utilization,
  categorySummary,
  hasCostProfile,
}: {
  aircraft: Aircraft;
  costData: CostData;
  breakdown: CategoryBreakdown[];
  trend: MonthlyTrend[];
  utilization: { message: string; marginalReduction: number };
  categorySummary: CategoryBreakdown[];
  hasCostProfile: boolean;
}) {
  if (!aircraft) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Cost Dashboard</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Add an aircraft first to start tracking costs.
            </p>
            <Button
              className="mt-4"
              render={<Link href="/dashboard/aircraft/new" />}
              nativeButton={false}
            >
              Add Aircraft
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasCostProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Cost Dashboard</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Set up your cost profile to see your true cost per hour.
            </p>
            <Button
              className="mt-4"
              render={
                <Link href={`/dashboard/aircraft/${aircraft.id}/costs`} />
              }
              nativeButton={false}
            >
              Set Up Cost Tracking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData = costData.totalHours > 0;
  const grandTotal = breakdown.reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cost Dashboard</h1>
        <span className="text-sm text-muted-foreground">
          {aircraft.tail_number} — trailing 12 months
        </span>
      </div>

      {/* Big Number */}
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Your Cost Per Hour
          </p>
          <p className="text-5xl font-bold tabular-nums">
            {hasData ? `$${costData.totalCostPerHour.toFixed(2)}` : "—"}
          </p>
          {hasData && (
            <p className="mt-2 text-sm text-muted-foreground">
              Based on {costData.totalHours.toFixed(1)} hours flown
            </p>
          )}
          {!hasData && (
            <p className="mt-2 text-sm text-muted-foreground">
              Log some flights to see your cost per hour
            </p>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BreakdownCard
          label="Fixed Costs"
          value={costData.fixedPerHour}
          hasData={hasData}
        />
        <BreakdownCard
          label="Fuel"
          value={costData.fuelPerHour}
          hasData={hasData}
        />
        <BreakdownCard
          label="Maintenance"
          value={costData.maintenancePerHour}
          hasData={hasData}
        />
        <BreakdownCard
          label="Engine Reserve"
          value={costData.reservePerHour}
          hasData={true}
        />
      </div>

      {/* Cost Trend Chart */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Per Hour — Trailing 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}/hr`,
                      name === "totalCostPerHour"
                        ? "Total"
                        : "Variable Only",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalCostPerHour"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="totalCostPerHour"
                  />
                  <Line
                    type="monotone"
                    dataKey="variableCostPerHour"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    name="variableCostPerHour"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-blue-500 inline-block" />
                Total Cost/Hr
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-emerald-500 inline-block border-dashed" style={{ borderTop: "2px dashed #10b981", height: 0 }} />
                Variable Only
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pie Chart */}
      {breakdown.length > 0 && grandTotal > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props: PieLabelRenderProps & { category?: string; percentage?: number }) =>
                      `${props.category ?? ""} (${(props.percentage ?? 0).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  >
                    {breakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Utilization Insight */}
      {hasData && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-500/10 p-2 text-blue-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Utilization Insight</p>
                <p className="text-sm text-muted-foreground">
                  {utilization.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Summary Table */}
      {categorySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expense Summary — Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      Total
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      Per Hour
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categorySummary.map((row) => (
                    <tr
                      key={row.category}
                      className="border-b border-border/50"
                    >
                      <td className="py-2">{row.category}</td>
                      <td className="py-2 text-right tabular-nums">
                        ${row.total.toFixed(2)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        ${row.perHour.toFixed(2)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {row.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {/* Grand total row */}
                  <tr className="font-medium">
                    <td className="pt-2">Total</td>
                    <td className="pt-2 text-right tabular-nums">
                      ${grandTotal.toFixed(2)}
                    </td>
                    <td className="pt-2 text-right tabular-nums">
                      $
                      {hasData
                        ? (grandTotal / costData.totalHours).toFixed(2)
                        : "—"}
                    </td>
                    <td className="pt-2 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BreakdownCard({
  label,
  value,
  hasData,
}: {
  label: string;
  value: number;
  hasData: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums mt-1">
          {hasData ? `$${value.toFixed(2)}` : "—"}
        </p>
        <p className="text-[10px] text-muted-foreground">/hr</p>
      </CardContent>
    </Card>
  );
}
