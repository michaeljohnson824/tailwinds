import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-lg">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-64" />
      <Skeleton className="h-20" />
      <Skeleton className="h-16" />
    </div>
  );
}
