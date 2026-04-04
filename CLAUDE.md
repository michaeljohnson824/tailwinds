# CLAUDE.md — Tailwinds

## Project Overview

Tailwinds is a web application for GA (general aviation) aircraft owners. It combines a pilot flight logbook with aircraft ownership cost tracking, maintenance management, and partnership billing. The tagline is "ForeFlight flies the plane. Tailwinds owns the plane."

The app targets private pilot aircraft owners (Cessna, Piper, Beechcraft, etc.) who currently track costs in spreadsheets and use mediocre logbook tools. The differentiator is unifying flight logging with true cost-per-hour analytics — no other logbook does this.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions, TypeScript strict)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Auth (email/password + Google OAuth + magic links)
- **ORM**: Drizzle ORM (with drizzle-kit for migrations)
- **UI**: Tailwind CSS v4 + Shadcn/ui components
- **Payments**: Stripe (Checkout, Customer Portal, Webhooks) — NOT in MVP, add in Layer 2
- **Deployment target**: Vercel
- **Email**: Resend + React Email — NOT in MVP
- **Package manager**: npm

## Architecture Principles

- **Server Components by default.** Only use `"use client"` when the component needs interactivity (forms, dropdowns, modals, client-side state). Data-fetching pages should be Server Components.
- **Server Actions for mutations.** Use Next.js Server Actions for all form submissions and data mutations (creating flights, updating aircraft, etc.). No API routes unless receiving external webhooks.
- **Supabase RLS is the security layer.** Every table must have Row Level Security policies. Users should only be able to read/write their own data. Partnership data uses a membership junction table for access control.
- **Mobile-first responsive design.** Most users will enter flights on their phone at the hangar. Design for 375px width first, then scale up.
- **Dark mode first.** Pilots use dark UIs (ForeFlight, Garmin). Default to dark theme with light mode toggle available. Use CSS variables for theming.
- **PWA-ready.** Include a manifest.json and service worker for add-to-home-screen support.

## Design Direction

The UI should feel like a **premium aviation instrument panel** — clean, data-dense, trustworthy. NOT generic SaaS. NOT dated aviation software.

- Dark background (#0a0f1a or similar deep navy/charcoal), not pure black
- Accent color: aviation blue (#3b82f6 range) or amber (#f59e0b) for warnings
- Green/yellow/red status indicators (familiar to pilots from instrument panels)
- Typography: use a clean, modern sans-serif — something like "DM Sans", "Plus Jakarta Sans", or "Outfit". NOT Inter, NOT Arial, NOT system fonts
- Data should be displayed with the precision pilots expect — decimal places for Hobbs/tach times (e.g., 1234.5), proper aviation formatting
- Cards with subtle borders, not heavy shadows
- Minimal chrome — let the data breathe

## Current Build Phase: MVP (Layer 1)

We are building the MVP — a free-tier logbook with the foundation for cost tracking. This includes:

### Pages to Build

1. **Marketing landing page** (`/`)
   - Hero with tagline, one screenshot/mockup, value prop
   - Three feature highlights (logbook, cost tracking, partnerships — last two marked "coming soon")
   - CTA: "Start logging for free"
   - Footer with links

2. **Auth pages** (`/login`, `/signup`, `/forgot-password`)
   - Supabase Auth with email/password
   - Google OAuth button
   - Clean, minimal auth forms using Shadcn/ui
   - Redirect to dashboard after auth

3. **Dashboard** (`/dashboard`)
   - Currency status: 4 cards (Night, IFR, Flight Review, Medical) showing green/yellow/red with days remaining
   - Quick stats: total flight hours, flights this month, hours this month
   - Recent flights: last 5 entries as compact list
   - Cost per hour teaser (if cost data exists, show the number; otherwise show "Set up cost tracking →")
   - "Log a Flight" primary action button, prominently placed

4. **Logbook** (`/dashboard/logbook`)
   - List view of all flights, newest first
   - Each row: date, route (KSNA → KSBA), total time, landings, conditions badge
   - Click to expand/view full details
   - Filter by date range, aircraft
   - Search in remarks
   - "Log a Flight" button

5. **Flight Entry Form** (`/dashboard/logbook/new` and `/dashboard/logbook/[id]/edit`)
   - THIS IS THE MOST IMPORTANT UI IN THE APP — it must be fast, clean, and completable in <30 seconds
   - Fields (in order):
     - Date (default: today)
     - Aircraft (dropdown, pre-selected if only one aircraft)
     - From (ICAO code input, e.g., "KSNA") / To (ICAO code)
     - Route/Via (optional text for intermediate stops)
     - Hobbs Start / Hobbs End (decimal inputs) → auto-compute Total Time
     - Tach Start / Tach End (decimal inputs)
     - Landings: Day (number) / Night (number)
     - Flight Conditions: VFR / IFR / SVFR (radio buttons)
     - Time breakdown (collapsible "Advanced" section):
       - Night time (decimal)
       - Instrument time (decimal)  
       - Instrument approaches (number)
       - Cross-country (checkbox)
       - PIC / SIC / Dual Given / Dual Received (decimal inputs)
     - Fuel (collapsible section):
       - Gallons purchased (decimal)
       - Price per gallon (decimal, USD)
     - Remarks (textarea)
   - Save button → redirect to logbook list
   - Auto-advance: after saving, update aircraft's current Hobbs and tach to the "end" values

6. **Aircraft Setup** (`/dashboard/aircraft` and `/dashboard/aircraft/new`)
   - Add aircraft form:
     - Tail number (e.g., N6049V)
     - Make/Model (e.g., Cessna 182P)
     - Year
     - Home airport (ICAO)
     - Current Hobbs reading (decimal)
     - Current tach reading (decimal)
   - Aircraft detail page showing profile info and summary stats
   - Edit capability

7. **Settings** (`/dashboard/settings`)
   - Profile (display name, email)
   - Preferences (default aircraft, dark/light mode, units)
   - Data: CSV import, CSV export
   - Account: sign out, delete account

### CSV Import (Critical for Adoption)

Support importing from:
- **MyFlightbook CSV export** — columns: Date, Route, Comments, Approaches, Night, IMC, Total Flight Time, Landings, etc.
- **ForeFlight CSV export** — columns: Date, AircraftID, From, To, Route, TotalTime, PIC, SIC, Night, etc.
- **Generic CSV** — let user map columns to fields

The import flow:
1. Upload CSV file
2. Auto-detect format (MyFlightbook vs ForeFlight vs generic)
3. Preview first 5 rows with field mapping
4. User confirms → bulk insert
5. Show success count and any skipped rows

### CSV Export

Export full logbook as CSV with all fields. Standard format that could be re-imported.

## Data Model

### Tables (Drizzle schema)

```typescript
// users table is managed by Supabase Auth (auth.users)
// We create a public.profiles table that syncs via trigger

profiles
- id: uuid (references auth.users.id)
- display_name: text
- email: text
- default_aircraft_id: uuid (nullable, references aircraft.id)
- medical_class: int (1, 2, or 3)
- medical_expiration: date (nullable)
- flight_review_date: date (nullable)
- subscription_tier: text ('free' | 'pilot' | 'partnership'), default 'free'
- preferences: jsonb (dark_mode, units, etc.)
- created_at: timestamp
- updated_at: timestamp

aircraft
- id: uuid, primary key
- owner_id: uuid (references profiles.id)
- tail_number: text, not null
- make_model: text, not null
- year: int
- home_airport: text (ICAO code)
- hobbs_current: decimal(10,1)
- tach_current: decimal(10,1)
- created_at: timestamp
- updated_at: timestamp

flights
- id: uuid, primary key
- aircraft_id: uuid (references aircraft.id)
- pilot_id: uuid (references profiles.id)
- date: date, not null
- route_from: text (ICAO)
- route_to: text (ICAO)
- route_via: text (nullable)
- hobbs_start: decimal(10,1)
- hobbs_end: decimal(10,1)
- tach_start: decimal(10,1)
- tach_end: decimal(10,1)
- total_time: decimal(10,1) (computed or stored: hobbs_end - hobbs_start)
- landings_day: int, default 0
- landings_night: int, default 0
- conditions: text ('VFR' | 'IFR' | 'SVFR'), default 'VFR'
- night_time: decimal(10,1), default 0
- instrument_time: decimal(10,1), default 0
- instrument_approaches: int, default 0
- cross_country: boolean, default false
- pic_time: decimal(10,1), default 0
- sic_time: decimal(10,1), default 0
- dual_given: decimal(10,1), default 0
- dual_received: decimal(10,1), default 0
- fuel_gallons: decimal(10,1) (nullable)
- fuel_price_per_gallon: decimal(10,2) (nullable)
- fuel_total_cost: decimal(10,2) (nullable, computed: gallons * price)
- remarks: text (nullable)
- created_at: timestamp
- updated_at: timestamp
```

### Row Level Security Policies

Every table needs RLS enabled. Policies:

```sql
-- profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- aircraft: users can only see/manage their own aircraft
CREATE POLICY "Users can view own aircraft" ON aircraft FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own aircraft" ON aircraft FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own aircraft" ON aircraft FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own aircraft" ON aircraft FOR DELETE USING (auth.uid() = owner_id);

-- flights: users can only see/manage flights they logged
CREATE POLICY "Users can view own flights" ON flights FOR SELECT USING (auth.uid() = pilot_id);
CREATE POLICY "Users can insert own flights" ON flights FOR INSERT WITH CHECK (auth.uid() = pilot_id);
CREATE POLICY "Users can update own flights" ON flights FOR UPDATE USING (auth.uid() = pilot_id);
CREATE POLICY "Users can delete own flights" ON flights FOR DELETE USING (auth.uid() = pilot_id);
```

### Profile Sync Trigger

Create a database trigger that automatically creates a profile row when a new user signs up via Supabase Auth:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Folder Structure

```
tailwinds/
├── CLAUDE.md
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                    # Landing page
│   │   │   └── layout.tsx                  # Marketing layout (no sidebar)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── auth/callback/route.ts      # Supabase OAuth callback
│   │   │   └── layout.tsx                  # Auth layout (centered card)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                  # Dashboard layout (sidebar + topbar + auth guard)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                # Main dashboard
│   │   │   ├── logbook/
│   │   │   │   ├── page.tsx                # Flight list
│   │   │   │   ├── new/page.tsx            # New flight entry
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx            # Flight detail
│   │   │   │       └── edit/page.tsx       # Edit flight
│   │   │   ├── aircraft/
│   │   │   │   ├── page.tsx                # Aircraft list
│   │   │   │   ├── new/page.tsx            # Add aircraft
│   │   │   │   └── [id]/page.tsx           # Aircraft detail
│   │   │   ├── import/page.tsx             # CSV import
│   │   │   └── settings/page.tsx           # User settings
│   │   ├── layout.tsx                      # Root layout (providers, fonts, metadata)
│   │   └── globals.css                     # Tailwind base + CSS variables
│   ├── components/
│   │   ├── ui/                             # Shadcn/ui components (installed via CLI)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── logbook/
│   │   │   ├── flight-entry-form.tsx
│   │   │   ├── flight-list.tsx
│   │   │   ├── flight-list-item.tsx
│   │   │   └── flight-detail.tsx
│   │   ├── aircraft/
│   │   │   ├── aircraft-form.tsx
│   │   │   └── aircraft-card.tsx
│   │   ├── dashboard/
│   │   │   ├── currency-card.tsx
│   │   │   ├── currency-grid.tsx
│   │   │   ├── quick-stats.tsx
│   │   │   └── recent-flights.tsx
│   │   ├── import/
│   │   │   ├── csv-upload.tsx
│   │   │   ├── field-mapper.tsx
│   │   │   └── import-preview.tsx
│   │   └── providers/
│   │       └── theme-provider.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # createBrowserClient()
│   │   │   ├── server.ts                   # createServerClient() for Server Components
│   │   │   ├── middleware.ts               # Auth session refresh middleware
│   │   │   └── admin.ts                    # Service role client (webhooks only)
│   │   ├── actions/
│   │   │   ├── flights.ts                  # Server Actions: createFlight, updateFlight, deleteFlight
│   │   │   ├── aircraft.ts                 # Server Actions: createAircraft, updateAircraft
│   │   │   ├── import.ts                   # Server Action: importCSV
│   │   │   └── profile.ts                  # Server Actions: updateProfile
│   │   ├── queries/
│   │   │   ├── flights.ts                  # Data fetching: getFlights, getFlight, getFlightStats
│   │   │   ├── aircraft.ts                 # Data fetching: getAircraft, getUserAircraft
│   │   │   ├── currencies.ts               # Data fetching: getCurrencyStatus
│   │   │   └── profile.ts                  # Data fetching: getProfile
│   │   ├── utils/
│   │   │   ├── aviation.ts                 # ICAO airport validation, formatting helpers
│   │   │   ├── currency-calc.ts            # Night/IFR/FR/medical currency computation
│   │   │   ├── csv-parser.ts               # CSV import parsing and format detection
│   │   │   └── format.ts                   # Number formatting, date formatting
│   │   ├── validations/
│   │   │   ├── flight.ts                   # Zod schema for flight entry
│   │   │   └── aircraft.ts                 # Zod schema for aircraft
│   │   └── constants.ts                    # App constants
│   ├── db/
│   │   ├── schema.ts                       # Drizzle schema definitions
│   │   └── index.ts                        # Drizzle client instance
│   └── types/
│       └── index.ts                        # Shared TypeScript types
├── public/
│   ├── manifest.json
│   └── icons/
├── supabase/
│   └── migrations/                         # SQL migration files
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
└── package.json
```

## Coding Standards

- **TypeScript strict mode** — no `any` types, no `@ts-ignore`
- **Functional components only** — no class components
- **Named exports** — no default exports (except page.tsx files which Next.js requires)
- **Zod for validation** — all form inputs validated with Zod schemas before Server Action execution
- **Error handling** — Server Actions return `{ success: boolean, error?: string, data?: T }`, never throw
- **Loading states** — use Suspense boundaries and loading.tsx files for page-level loading, `useFormStatus` for form submission states
- **No barrel files** — import directly from the source file, not through index.ts re-exports (hurts tree-shaking)
- **Decimal handling** — Hobbs, tach, and flight times are always displayed to 1 decimal place (e.g., 1234.5). Use `toFixed(1)` for display. Store as `decimal(10,1)` in the database.
- **Date handling** — Use ISO date strings (YYYY-MM-DD) for dates. Display in user's local format. All dates in the database are UTC.
- **ICAO codes** — Airport identifiers are always uppercase, 3-4 characters (e.g., KSNA, LAX). Auto-uppercase on input.

## Commands

```bash
# Development
npm run dev                    # Start Next.js dev server
npx drizzle-kit push          # Push schema changes to Supabase
npx drizzle-kit generate      # Generate migration files
npx drizzle-kit studio        # Open Drizzle Studio (DB browser)

# Shadcn/ui component installation
npx shadcn@latest add button  # Install a component
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add separator

# Build & deploy
npm run build                  # Production build
npm run lint                   # ESLint
```

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Supabase DB (for Drizzle)
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Notes

- Do NOT install Clerk, Auth0, or any external auth library. We use Supabase Auth exclusively.
- Do NOT create API route handlers for CRUD operations. Use Server Actions instead. Only create route handlers for external webhook endpoints (Stripe, etc.) which are NOT part of the MVP.
- Do NOT add Stripe or payment features yet. The MVP is entirely free-tier.
- Do NOT use the Pages Router or any legacy Next.js patterns. App Router only.
- The flight entry form is the single most important piece of UI. Optimize it for speed — minimal clicks, smart defaults, auto-advancing fields where possible.
- When the user saves a flight, automatically update the aircraft's hobbs_current and tach_current to the flight's end values.
- Currency calculations are derived from the flights table — query recent flights to determine if night/IFR/etc. currency is current. Do NOT store currency status separately; compute it on read.

## Build Order

Follow this sequence:

1. **Project scaffolding**: Initialize Next.js, install dependencies, configure Tailwind + Shadcn/ui, set up Supabase client utilities and middleware
2. **Database**: Define Drizzle schema, push to Supabase, set up RLS policies and profile sync trigger
3. **Auth**: Login, signup, forgot password pages. OAuth callback route. Dashboard layout with auth guard (redirect to login if not authenticated). Sign out functionality.
4. **Aircraft CRUD**: Add aircraft form, aircraft list, aircraft detail page
5. **Flight entry form**: The core UI. Build it, test it, refine it.
6. **Logbook list**: Flight list with sorting and filtering
7. **Dashboard**: Currency cards, quick stats, recent flights
8. **CSV import**: Upload, parse, preview, import flow
9. **CSV export**: Download full logbook as CSV
10. **Landing page**: Marketing page with signup CTA
11. **Polish**: Loading states, error handling, empty states, mobile responsiveness, dark mode refinement
