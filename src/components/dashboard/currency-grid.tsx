import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { CurrencyItem, CurrencyStatus } from "@/lib/queries/currencies";

const statusConfig: Record<
  CurrencyStatus,
  { bg: string; border: string; dot: string; text: string }
> = {
  current: {
    bg: "bg-success/10",
    border: "border-success/30",
    dot: "bg-success",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    dot: "bg-warning",
    text: "text-warning",
  },
  expired: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    dot: "bg-destructive",
    text: "text-destructive",
  },
  not_set: {
    bg: "bg-muted/50",
    border: "border-border",
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
  },
};

export function CurrencyGrid({ currencies }: { currencies: CurrencyItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {currencies.map((c) => {
        const style = statusConfig[c.status];
        return (
          <Card
            key={c.label}
            className={`${style.bg} ${style.border} border`}
          >
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                {c.status === "not_set" ? (
                  <Link
                    href="/dashboard/settings"
                    className="text-xs text-primary hover:underline"
                  >
                    Set in settings →
                  </Link>
                ) : (
                  <p className={`text-xs ${style.text}`}>{c.detail}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                <span
                  className={`text-xs font-semibold uppercase ${style.text}`}
                >
                  {c.status === "not_set"
                    ? "—"
                    : c.status === "expired"
                      ? "EXPIRED"
                      : c.status === "warning"
                        ? "EXPIRING"
                        : "CURRENT"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
