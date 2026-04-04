"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  parseCSV,
  detectFormat,
  getDefaultMapping,
  mapRowToFlight,
  TAILWINDS_FIELDS,
  FIELD_LABELS,
  type DetectedFormat,
  type FieldMapping,
  type ParsedFlight,
} from "@/lib/utils/csv-parser";
import { importFlights, type ImportResult } from "@/lib/actions/import";

type AircraftOption = { id: string; tail_number: string };

type Step = "upload" | "preview" | "importing" | "done";

export function CSVImportWizard({ aircraft }: { aircraft: AircraftOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [format, setFormat] = useState<DetectedFormat>("generic");
  const [mapping, setMapping] = useState<FieldMapping>({} as FieldMapping);
  const [aircraftId, setAircraftId] = useState(
    aircraft.length === 1 ? aircraft[0].id : ""
  );
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers: h, rows: r } = parseCSV(text);
        if (h.length === 0) return;
        const fmt = detectFormat(h);
        setHeaders(h);
        setRows(r);
        setFormat(fmt);
        setMapping(getDefaultMapping(h, fmt));
        setStep("preview");
      };
      reader.readAsText(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = useCallback(async () => {
    if (!aircraftId) return;
    setStep("importing");

    const parsed: ParsedFlight[] = [];
    const skipped: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { flight, error } = mapRowToFlight(rows[i], headers, mapping, format);
      if (flight) {
        parsed.push(flight);
      } else {
        skipped.push({ row: i + 2, reason: error ?? "Unknown error" });
      }
    }

    const res = await importFlights(aircraftId, parsed);
    res.skipped = [...skipped, ...res.skipped];
    setResult(res);
    setStep("done");
  }, [aircraftId, rows, headers, mapping, format]);

  const updateMapping = (field: keyof FieldMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value || null }));
  };

  // STEP: Upload
  if (step === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Flights from CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <UploadIcon className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">
              Drag and drop a CSV file here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports MyFlightbook, ForeFlight, and generic CSV formats
            </p>
            <label className="mt-4">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <span className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted transition-colors">
                Browse files
              </span>
            </label>
          </div>
        </CardContent>
      </Card>
    );
  }

  // STEP: Preview & mapping
  if (step === "preview") {
    const previewRows = rows.slice(0, 5);

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview & Field Mapping</CardTitle>
              <Badge variant="secondary">
                {format === "myflightbook"
                  ? "MyFlightbook"
                  : format === "foreflight"
                    ? "ForeFlight"
                    : "Generic CSV"}{" "}
                detected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {rows.length} rows found. Showing first {previewRows.length}.
            </p>

            {/* Aircraft selector */}
            <div className="grid gap-2 max-w-xs">
              <Label htmlFor="importAircraft">Import to aircraft</Label>
              <select
                id="importAircraft"
                value={aircraftId}
                onChange={(e) => setAircraftId(e.target.value)}
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

            {/* Field mapping */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TAILWINDS_FIELDS.map((field) => (
                <div key={field} className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    {FIELD_LABELS[field]}
                    {field === "date" && " *"}
                    {field === "totalTime" && " *"}
                  </Label>
                  <select
                    value={mapping[field] ?? ""}
                    onChange={(e) => updateMapping(field, e.target.value)}
                    className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
                  >
                    <option value="">— Skip —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-2 py-1.5 text-left font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="whitespace-nowrap px-2 py-1 max-w-32 truncate"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setHeaders([]);
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!aircraftId || !mapping.date || !mapping.totalTime}
              >
                Import {rows.length} flights
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP: Importing
  if (step === "importing") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Importing flights...
          </p>
        </CardContent>
      </Card>
    );
  }

  // STEP: Done
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {result?.success ? "Import Complete" : "Import Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result?.error && (
          <p className="text-sm text-destructive">{result.error}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-success/10 p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {result?.imported ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Imported</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-bold">
              {result?.skipped.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
        </div>

        {result && result.skipped.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-2 py-1 text-left font-medium">Row</th>
                  <th className="px-2 py-1 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-2 py-1">{s.row}</td>
                    <td className="px-2 py-1">{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setStep("upload");
              setRows([]);
              setHeaders([]);
              setResult(null);
            }}
          >
            Import more
          </Button>
          <Button onClick={() => router.push("/dashboard/logbook")}>
            View logbook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
