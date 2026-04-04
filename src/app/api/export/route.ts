import { createClient } from "@/lib/supabase/server";

const CSV_HEADERS = [
  "Date",
  "Aircraft",
  "From",
  "To",
  "Via",
  "Total_Time",
  "Hobbs_Start",
  "Hobbs_End",
  "Tach_Start",
  "Tach_End",
  "Landings_Day",
  "Landings_Night",
  "Conditions",
  "Night_Time",
  "Instrument_Time",
  "Instrument_Approaches",
  "Cross_Country",
  "PIC",
  "SIC",
  "Dual_Given",
  "Dual_Received",
  "Fuel_Gallons",
  "Fuel_Price_Per_Gallon",
  "Fuel_Total_Cost",
  "Remarks",
];

// Column indices (0-based) that should be summed in the totals row
// Skipping: Date(0), Aircraft(1), From(2), To(3), Via(4), Conditions(12), Cross_Country(16), Remarks(24)
const SUM_INDICES = [5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23];

function escapeCsv(val: string | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function num(val: unknown): number {
  if (val == null) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: flights } = await supabase
    .from("flights")
    .select("*, aircraft:aircraft_id(tail_number)")
    .eq("pilot_id", user.id)
    .order("date", { ascending: true });

  if (!flights || flights.length === 0) {
    return new Response("No flights to export", { status: 404 });
  }

  const dataRows: string[][] = flights.map((f) => {
    const tail =
      f.aircraft && typeof f.aircraft === "object" && "tail_number" in f.aircraft
        ? (f.aircraft as { tail_number: string }).tail_number
        : "";

    return [
      f.date ?? "",                                                          // 0  Date
      tail,                                                                  // 1  Aircraft
      f.route_from ?? "",                                                    // 2  From
      f.route_to ?? "",                                                      // 3  To
      f.route_via ?? "",                                                     // 4  Via
      f.total_time != null ? Number(f.total_time).toFixed(1) : "",           // 5  Total_Time
      f.hobbs_start != null ? Number(f.hobbs_start).toFixed(1) : "",         // 6  Hobbs_Start
      f.hobbs_end != null ? Number(f.hobbs_end).toFixed(1) : "",             // 7  Hobbs_End
      f.tach_start != null ? Number(f.tach_start).toFixed(1) : "",           // 8  Tach_Start
      f.tach_end != null ? Number(f.tach_end).toFixed(1) : "",               // 9  Tach_End
      String(f.landings_day ?? 0),                                           // 10 Landings_Day
      String(f.landings_night ?? 0),                                         // 11 Landings_Night
      f.conditions ?? "VFR",                                                 // 12 Conditions
      Number(f.night_time ?? 0).toFixed(1),                                  // 13 Night_Time
      Number(f.instrument_time ?? 0).toFixed(1),                             // 14 Instrument_Time
      String(f.instrument_approaches ?? 0),                                  // 15 Instrument_Approaches
      f.cross_country ? "Yes" : "No",                                        // 16 Cross_Country
      Number(f.pic_time ?? 0).toFixed(1),                                    // 17 PIC
      Number(f.sic_time ?? 0).toFixed(1),                                    // 18 SIC
      Number(f.dual_given ?? 0).toFixed(1),                                  // 19 Dual_Given
      Number(f.dual_received ?? 0).toFixed(1),                               // 20 Dual_Received
      f.fuel_gallons != null ? Number(f.fuel_gallons).toFixed(1) : "",       // 21 Fuel_Gallons
      f.fuel_price_per_gallon != null ? Number(f.fuel_price_per_gallon).toFixed(2) : "",  // 22 Fuel_Price
      f.fuel_total_cost != null ? Number(f.fuel_total_cost).toFixed(2) : "", // 23 Fuel_Total_Cost
      f.remarks ?? "",                                                       // 24 Remarks
    ];
  });

  // Build totals row
  const totals: string[] = CSV_HEADERS.map(() => "");
  totals[0] = "TOTALS";

  for (const idx of SUM_INDICES) {
    let sum = 0;
    for (const row of dataRows) {
      sum += num(row[idx]);
    }
    // Integers for landings/approaches, 1 decimal for hours, 2 decimal for costs
    if (idx === 10 || idx === 11 || idx === 15) {
      totals[idx] = String(Math.round(sum));
    } else if (idx === 22 || idx === 23) {
      totals[idx] = sum > 0 ? sum.toFixed(2) : "";
    } else {
      totals[idx] = sum > 0 ? sum.toFixed(1) : "";
    }
  }

  const csvRows = [
    CSV_HEADERS.join(","),
    ...dataRows.map((row) => row.map(escapeCsv).join(",")),
    totals.map(escapeCsv).join(","),
  ];

  const csv = csvRows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tailwinds-logbook-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
