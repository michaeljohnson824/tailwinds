import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function PaidFeatureTeaser({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-500/10 p-1.5">
            <LockIcon className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Link
          href="/dashboard/costs"
          className="text-xs text-primary hover:underline whitespace-nowrap"
        >
          Upgrade &rarr;
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
