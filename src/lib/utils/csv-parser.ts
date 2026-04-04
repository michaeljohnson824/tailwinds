export type DetectedFormat = "myflightbook" | "foreflight" | "generic";

export type FieldMapping = {
  date: string | null;
  routeFrom: string | null;
  routeTo: string | null;
  routeVia: string | null;
  totalTime: string | null;
  landingsDay: string | null;
  landingsNight: string | null;
  conditions: string | null;
  nightTime: string | null;
  instrumentTime: string | null;
  instrumentApproaches: string | null;
  crossCountry: string | null;
  picTime: string | null;
  sicTime: string | null;
  dualGiven: string | null;
  dualReceived: string | null;
  fuelGallons: string | null;
  remarks: string | null;
};

export const TAILWINDS_FIELDS: (keyof FieldMapping)[] = [
  "date",
  "routeFrom",
  "routeTo",
  "routeVia",
  "totalTime",
  "landingsDay",
  "landingsNight",
  "conditions",
  "nightTime",
  "instrumentTime",
  "instrumentApproaches",
  "crossCountry",
  "picTime",
  "sicTime",
  "dualGiven",
  "dualReceived",
  "fuelGallons",
  "remarks",
];

export const FIELD_LABELS: Record<keyof FieldMapping, string> = {
  date: "Date",
  routeFrom: "From",
  routeTo: "To",
  routeVia: "Via",
  totalTime: "Total Time",
  landingsDay: "Day Landings",
  landingsNight: "Night Landings",
  conditions: "Conditions",
  nightTime: "Night Time",
  instrumentTime: "Instrument Time",
  instrumentApproaches: "Approaches",
  crossCountry: "Cross-Country",
  picTime: "PIC",
  sicTime: "SIC",
  dualGiven: "Dual Given",
  dualReceived: "Dual Received",
  fuelGallons: "Fuel Gallons",
  remarks: "Remarks",
};

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  return { headers, rows };
}

export function detectFormat(headers: string[]): DetectedFormat {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // MyFlightbook: has "Route", "Total Flight Time", "Comments"
  if (
    lowerHeaders.includes("date") &&
    (lowerHeaders.includes("route") || lowerHeaders.includes("route of flight")) &&
    (lowerHeaders.includes("total flight time") || lowerHeaders.includes("totalflighttime"))
  ) {
    return "myflightbook";
  }

  // ForeFlight: has "AircraftID" or "Aircraft", "From", "To", "TotalTime"
  if (
    lowerHeaders.includes("date") &&
    (lowerHeaders.includes("from") || lowerHeaders.includes("departure")) &&
    (lowerHeaders.includes("totaltime") || lowerHeaders.includes("total time"))
  ) {
    return "foreflight";
  }

  // Tailwinds own export format
  if (
    lowerHeaders.includes("date") &&
    lowerHeaders.includes("from") &&
    lowerHeaders.includes("total_time")
  ) {
    return "foreflight"; // Same mapping works
  }

  return "generic";
}

function findHeader(headers: string[], ...candidates: string[]): string | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lowerHeaders.indexOf(c.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function getDefaultMapping(
  headers: string[],
  format: DetectedFormat
): FieldMapping {
  if (format === "myflightbook") {
    return {
      date: findHeader(headers, "Date"),
      routeFrom: null, // MyFlightbook has "Route" as combined field, we'll parse it
      routeTo: null,
      routeVia: findHeader(headers, "Route", "Route of Flight"),
      totalTime: findHeader(headers, "Total Flight Time", "TotalFlightTime"),
      landingsDay: findHeader(headers, "Day Landings", "FullStopLandings", "Landings"),
      landingsNight: findHeader(headers, "Night Landings", "NightLandings"),
      conditions: null,
      nightTime: findHeader(headers, "Night", "Night Time"),
      instrumentTime: findHeader(headers, "IMC", "Instrument", "Simulated Instrument", "ActualIMC"),
      instrumentApproaches: findHeader(headers, "Approaches"),
      crossCountry: findHeader(headers, "Cross-Country", "CrossCountry", "X-Country", "XC"),
      picTime: findHeader(headers, "PIC"),
      sicTime: findHeader(headers, "SIC"),
      dualGiven: findHeader(headers, "CFI", "Dual Given"),
      dualReceived: findHeader(headers, "Dual Received", "Dual"),
      fuelGallons: null,
      remarks: findHeader(headers, "Comments", "Remarks"),
    };
  }

  if (format === "foreflight") {
    return {
      date: findHeader(headers, "Date"),
      routeFrom: findHeader(headers, "From", "Departure", "route_from"),
      routeTo: findHeader(headers, "To", "Arrival", "Destination", "route_to"),
      routeVia: findHeader(headers, "Route", "Via", "route_via"),
      totalTime: findHeader(headers, "TotalTime", "Total Time", "total_time"),
      landingsDay: findHeader(headers, "DayLandings", "Day Landings", "DayLandingsFullStop", "landings_day"),
      landingsNight: findHeader(headers, "NightLandings", "Night Landings", "NightLandingsFullStop", "landings_night"),
      conditions: findHeader(headers, "Conditions", "conditions"),
      nightTime: findHeader(headers, "Night", "NightTime", "night_time"),
      instrumentTime: findHeader(headers, "ActualInstrument", "SimulatedInstrument", "InstrumentTime", "instrument_time"),
      instrumentApproaches: findHeader(headers, "Approaches", "InstrumentApproaches", "instrument_approaches"),
      crossCountry: findHeader(headers, "CrossCountry", "XC", "cross_country"),
      picTime: findHeader(headers, "PIC", "pic_time"),
      sicTime: findHeader(headers, "SIC", "sic_time"),
      dualGiven: findHeader(headers, "DualGiven", "dual_given"),
      dualReceived: findHeader(headers, "DualReceived", "dual_received"),
      fuelGallons: findHeader(headers, "FuelGallons", "fuel_gallons"),
      remarks: findHeader(headers, "Remarks", "Comments", "PilotComments", "remarks"),
    };
  }

  // Generic: try common column names
  return {
    date: findHeader(headers, "Date", "date", "Flight Date"),
    routeFrom: findHeader(headers, "From", "Departure", "Origin", "route_from"),
    routeTo: findHeader(headers, "To", "Destination", "Arrival", "route_to"),
    routeVia: findHeader(headers, "Via", "Route", "route_via"),
    totalTime: findHeader(headers, "Total Time", "TotalTime", "Duration", "Hours", "total_time"),
    landingsDay: findHeader(headers, "Day Landings", "Landings", "landings_day"),
    landingsNight: findHeader(headers, "Night Landings", "landings_night"),
    conditions: findHeader(headers, "Conditions", "conditions"),
    nightTime: findHeader(headers, "Night", "Night Time", "night_time"),
    instrumentTime: findHeader(headers, "Instrument", "IMC", "instrument_time"),
    instrumentApproaches: findHeader(headers, "Approaches", "instrument_approaches"),
    crossCountry: findHeader(headers, "Cross-Country", "XC", "cross_country"),
    picTime: findHeader(headers, "PIC", "pic_time"),
    sicTime: findHeader(headers, "SIC", "sic_time"),
    dualGiven: findHeader(headers, "Dual Given", "CFI", "dual_given"),
    dualReceived: findHeader(headers, "Dual Received", "Dual", "dual_received"),
    fuelGallons: findHeader(headers, "Fuel", "Gallons", "fuel_gallons"),
    remarks: findHeader(headers, "Remarks", "Comments", "Notes", "remarks"),
  };
}

export type ParsedFlight = {
  date: string;
  route_from: string | null;
  route_to: string | null;
  route_via: string | null;
  total_time: number | null;
  landings_day: number;
  landings_night: number;
  conditions: string;
  night_time: number;
  instrument_time: number;
  instrument_approaches: number;
  cross_country: boolean;
  pic_time: number;
  sic_time: number;
  dual_given: number;
  dual_received: number;
  fuel_gallons: number | null;
  remarks: string | null;
};

function getVal(row: string[], headers: string[], col: string | null): string {
  if (!col) return "";
  const idx = headers.indexOf(col);
  if (idx === -1) return "";
  return (row[idx] ?? "").trim();
}

function parseNum(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function parseDate(val: string): string | null {
  if (!val) return null;
  // Handle various date formats
  // ISO: 2025-01-15
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  // US: 01/15/2025 or 1/15/2025
  const usParts = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (usParts) {
    return `${usParts[3]}-${usParts[1].padStart(2, "0")}-${usParts[2].padStart(2, "0")}`;
  }
  return null;
}

export function mapRowToFlight(
  row: string[],
  headers: string[],
  mapping: FieldMapping,
  format: DetectedFormat
): { flight: ParsedFlight | null; error: string | null } {
  const date = parseDate(getVal(row, headers, mapping.date));
  if (!date) return { flight: null, error: "Missing or invalid date" };

  const totalTime = parseNum(getVal(row, headers, mapping.totalTime));
  if (totalTime <= 0) return { flight: null, error: "Missing total time" };

  let routeFrom: string | null = null;
  let routeTo: string | null = null;
  let routeVia: string | null = null;

  if (format === "myflightbook" && mapping.routeVia) {
    // MyFlightbook "Route" is like "KSNA-KSBA" or "KSNA-VNY-KSBA"
    const route = getVal(row, headers, mapping.routeVia);
    const parts = route.split(/[-\s]+/).filter(Boolean);
    if (parts.length >= 1) routeFrom = parts[0].toUpperCase();
    if (parts.length >= 2) routeTo = parts[parts.length - 1].toUpperCase();
    if (parts.length >= 3) routeVia = parts.slice(1, -1).join(" ").toUpperCase();
  } else {
    routeFrom = getVal(row, headers, mapping.routeFrom).toUpperCase() || null;
    routeTo = getVal(row, headers, mapping.routeTo).toUpperCase() || null;
    routeVia = getVal(row, headers, mapping.routeVia).toUpperCase() || null;
  }

  const xcVal = getVal(row, headers, mapping.crossCountry).toLowerCase();
  const crossCountry =
    xcVal === "true" || xcVal === "1" || xcVal === "yes" || xcVal === "x" || parseNum(xcVal) > 0;

  return {
    flight: {
      date,
      route_from: routeFrom,
      route_to: routeTo,
      route_via: routeVia,
      total_time: totalTime,
      landings_day: Math.round(parseNum(getVal(row, headers, mapping.landingsDay))),
      landings_night: Math.round(parseNum(getVal(row, headers, mapping.landingsNight))),
      conditions: getVal(row, headers, mapping.conditions).toUpperCase() || "VFR",
      night_time: parseNum(getVal(row, headers, mapping.nightTime)),
      instrument_time: parseNum(getVal(row, headers, mapping.instrumentTime)),
      instrument_approaches: Math.round(
        parseNum(getVal(row, headers, mapping.instrumentApproaches))
      ),
      cross_country: crossCountry,
      pic_time: parseNum(getVal(row, headers, mapping.picTime)),
      sic_time: parseNum(getVal(row, headers, mapping.sicTime)),
      dual_given: parseNum(getVal(row, headers, mapping.dualGiven)),
      dual_received: parseNum(getVal(row, headers, mapping.dualReceived)),
      fuel_gallons: parseNum(getVal(row, headers, mapping.fuelGallons)) || null,
      remarks: getVal(row, headers, mapping.remarks) || null,
    },
    error: null,
  };
}
