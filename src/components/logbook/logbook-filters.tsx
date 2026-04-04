"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AircraftOption = {
  id: string;
  tail_number: string;
};

export function LogbookFilters({
  aircraft,
}: {
  aircraft: AircraftOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="grid gap-1.5">
        <Label htmlFor="search" className="text-xs text-muted-foreground">
          Search remarks
        </Label>
        <Input
          id="search"
          placeholder="Search..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            // Debounce by only updating on blur or enter
          }}
          onBlur={(e) => updateParam("search", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("search", (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>

      {aircraft.length > 1 && (
        <div className="grid gap-1.5">
          <Label htmlFor="aircraft" className="text-xs text-muted-foreground">
            Aircraft
          </Label>
          <select
            id="aircraft"
            defaultValue={searchParams.get("aircraft") ?? ""}
            onChange={(e) => updateParam("aircraft", e.target.value)}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">All aircraft</option>
            {aircraft.map((a) => (
              <option key={a.id} value={a.id}>
                {a.tail_number}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
          From date
        </Label>
        <Input
          id="dateFrom"
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          onChange={(e) => updateParam("dateFrom", e.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
          To date
        </Label>
        <Input
          id="dateTo"
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          onChange={(e) => updateParam("dateTo", e.target.value)}
        />
      </div>
    </div>
  );
}
