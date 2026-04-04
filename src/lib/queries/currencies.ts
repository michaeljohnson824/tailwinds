import { createClient } from "@/lib/supabase/server";

export type CurrencyStatus = "current" | "warning" | "expired" | "not_set";

export type CurrencyItem = {
  label: string;
  status: CurrencyStatus;
  detail: string;
  daysRemaining: number | null;
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export async function getCurrencyStatus(): Promise<CurrencyItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("flight_review_date, medical_expiration, medical_class")
    .eq("id", user.id)
    .single();

  // Date boundaries
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const ninetyDaysAgo = addDays(now, -90);
  const sixMonthsAgo = addMonths(now.toISOString().split("T")[0], -6);

  // Night currency: 3 full-stop night landings in last 90 days
  const { data: nightFlights } = await supabase
    .from("flights")
    .select("date, landings_night")
    .eq("pilot_id", user.id)
    .gte("date", ninetyDaysAgo)
    .gt("landings_night", 0)
    .order("date", { ascending: false });

  const nightLandings = (nightFlights ?? []).reduce(
    (sum, f) => sum + (f.landings_night ?? 0),
    0
  );

  // For night currency expiration: find the 3rd most recent night landing date,
  // then add 90 days to get when currency expires
  let nightCurrency: CurrencyItem;
  if (nightLandings >= 3) {
    // Find the date of the 3rd landing (expand each flight's landings)
    const landingDates: string[] = [];
    for (const f of nightFlights ?? []) {
      for (let i = 0; i < (f.landings_night ?? 0); i++) {
        landingDates.push(f.date);
      }
    }
    landingDates.sort((a, b) => b.localeCompare(a)); // newest first
    const thirdLandingDate = landingDates[2]; // 3rd most recent
    const expiresDate = addDays(new Date(thirdLandingDate + "T00:00:00"), 90);
    const days = daysUntil(expiresDate);

    nightCurrency = {
      label: "Night Currency",
      status: days <= 0 ? "expired" : days <= 14 ? "warning" : "current",
      detail:
        days <= 0
          ? "EXPIRED"
          : `${days} day${days !== 1 ? "s" : ""} remaining`,
      daysRemaining: days,
    };
  } else {
    nightCurrency = {
      label: "Night Currency",
      status: "expired",
      detail: `${nightLandings}/3 night landings (90 days)`,
      daysRemaining: null,
    };
  }

  // IFR currency: 6 approaches in last 6 months
  const { data: ifrFlights } = await supabase
    .from("flights")
    .select("date, instrument_approaches")
    .eq("pilot_id", user.id)
    .gte("date", sixMonthsAgo)
    .gt("instrument_approaches", 0)
    .order("date", { ascending: false });

  const totalApproaches = (ifrFlights ?? []).reduce(
    (sum, f) => sum + (f.instrument_approaches ?? 0),
    0
  );

  let ifrCurrency: CurrencyItem;
  if (totalApproaches >= 6) {
    // Find date of the 6th approach, add 6 months
    const approachDates: string[] = [];
    for (const f of ifrFlights ?? []) {
      for (let i = 0; i < (f.instrument_approaches ?? 0); i++) {
        approachDates.push(f.date);
      }
    }
    approachDates.sort((a, b) => b.localeCompare(a));
    const sixthApproachDate = approachDates[5];
    const expiresDate = addMonths(sixthApproachDate, 6);
    const days = daysUntil(expiresDate);

    ifrCurrency = {
      label: "IFR Currency",
      status: days <= 0 ? "expired" : days <= 30 ? "warning" : "current",
      detail:
        days <= 0
          ? "EXPIRED"
          : `${days} day${days !== 1 ? "s" : ""} remaining`,
      daysRemaining: days,
    };
  } else {
    ifrCurrency = {
      label: "IFR Currency",
      status: "expired",
      detail: `${totalApproaches}/6 approaches (6 months)`,
      daysRemaining: null,
    };
  }

  // Flight review: flight_review_date + 24 months
  let flightReview: CurrencyItem;
  if (profile?.flight_review_date) {
    const expiresDate = addMonths(profile.flight_review_date, 24);
    const days = daysUntil(expiresDate);
    flightReview = {
      label: "Flight Review",
      status: days <= 0 ? "expired" : days <= 60 ? "warning" : "current",
      detail:
        days <= 0
          ? "EXPIRED"
          : `${days} day${days !== 1 ? "s" : ""} remaining`,
      daysRemaining: days,
    };
  } else {
    flightReview = {
      label: "Flight Review",
      status: "not_set",
      detail: "Not set",
      daysRemaining: null,
    };
  }

  // Medical: medical_expiration date
  let medical: CurrencyItem;
  if (profile?.medical_expiration) {
    const days = daysUntil(profile.medical_expiration);
    const classLabel = profile.medical_class
      ? `Class ${profile.medical_class}`
      : "Medical";
    medical = {
      label: classLabel,
      status: days <= 0 ? "expired" : days <= 60 ? "warning" : "current",
      detail:
        days <= 0
          ? "EXPIRED"
          : `${days} day${days !== 1 ? "s" : ""} remaining`,
      daysRemaining: days,
    };
  } else {
    medical = {
      label: "Medical",
      status: "not_set",
      detail: "Not set",
      daysRemaining: null,
    };
  }

  return [nightCurrency, ifrCurrency, flightReview, medical];
}
