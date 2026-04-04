# Tailwinds — Architecture & Product Specification
## "ForeFlight flies the plane. Tailwinds owns the plane."

---

## PART 1: ARCHITECTURE

### The Stack

**Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- App Router is the universal standard in 2026 — Claude Code knows it cold
- Server Components for data-heavy dashboard pages (no client JS shipped for read-only views)
- Server Actions for form submissions (flight entries, expense logging) — eliminates API route boilerplate
- TypeScript strict mode throughout

**Database + Auth + Storage:** Supabase (all-in-one)
- PostgreSQL database with Row Level Security (RLS)
- Supabase Auth (built-in) — not Clerk, not Auth0
- Supabase Storage for receipt photos, logbook scans, document uploads
- Supabase Realtime for partnership features (shared squawk board, live flight updates)
- Free tier: 50K MAUs, 500MB database, 1GB storage — more than enough for MVP and early growth

**Why Supabase Auth over Clerk:**
- Native RLS integration — authorization happens at the database level, not middleware
- 50K free MAUs vs Clerk's 10K
- One vendor, one bill, one dashboard — no JWT bridging or integration complexity
- The Clerk + Supabase integration was deprecated in April 2025
- For a B2C consumer app (not enterprise B2B), Supabase Auth handles email/password, OAuth (Google, Apple), and magic links perfectly
- Trade-off: you build your own auth UI (login/signup forms) — but with Shadcn/ui this takes ~2 hours

**ORM:** Drizzle ORM
- Lighter and faster than Prisma, better TypeScript inference
- SQL-like syntax that maps naturally to PostgreSQL
- Works natively with Supabase's Postgres — no abstraction mismatch
- Schema-as-code with push migrations (drizzle-kit)
- Claude Code generates excellent Drizzle schemas

**UI:** Tailwind CSS + Shadcn/ui
- Tailwind for utility-first styling — Claude Code's strongest CSS framework
- Shadcn/ui for pre-built accessible components (dialogs, dropdowns, data tables, forms)
- Not a dependency — components are copied into your project and fully customizable
- Dark mode support out of the box (pilots use iPads in dark cockpits)

**Payments:** Stripe
- Stripe Checkout for subscription sign-up
- Stripe Customer Portal for self-service plan management
- Stripe Webhooks for subscription lifecycle (created, updated, canceled)
- Products: Free, Pilot ($9/mo), Partnership ($29/mo)

**Deployment:** Vercel
- Native Next.js host — zero configuration deployment
- Edge functions, preview deployments for every PR
- Free tier handles early traffic easily
- Custom domain: app.tailwinds.aero or similar

**Email:** Resend
- Transactional emails: welcome, password reset, maintenance reminders, settlement notifications
- React Email for templating (same JSX you already know)
- Free tier: 100 emails/day — plenty for MVP

**AI (Layer 5 — future):** Anthropic Claude API
- Vision API for receipt/invoice scanning (you already know this from SplitTab)
- Text generation for natural language logbook search
- Structured output for extracting data from scanned maintenance logs

### Key Architecture Decisions

**PWA first, not native mobile**
- Responsive web app that works on phone, tablet, and desktop
- Add to home screen via PWA manifest — feels native on iOS/Android
- Service worker for offline capability (log a flight without cell service at the hangar)
- Eliminates App Store review cycles and dual codebases
- Revisit native only if you hit 1,000+ paying users

**No boilerplate purchase needed**
- Claude Code can scaffold Next.js + Supabase + Stripe from scratch with a good CLAUDE.md
- Boilerplates (Supastarter, Makerkit, ShipFast) add opinions and complexity you'll fight with
- Your app's data model is domain-specific enough that boilerplate plumbing doesn't save much
- If you want to save 4-6 hours on auth/payments scaffolding, Makerkit ($349) is the best Supabase-native option — but not required

**Row Level Security is your multi-tenancy layer**
- Every table has an RLS policy: users can only see their own data
- Partnership/club data uses a membership junction table — RLS checks membership
- This means even if your API has a bug, the database won't leak data between users
- Critical for the partnership tier where multiple users access shared aircraft records

### Data Model (Core Tables)

```
users
├── id (uuid, from Supabase Auth)
├── email
├── display_name
├── subscription_tier (free | pilot | partnership)
├── created_at

aircraft
├── id (uuid)
├── owner_id → users.id
├── tail_number (e.g., "N6049V")
├── make_model (e.g., "Cessna 182P")
├── year
├── home_airport (e.g., "KSNA")
├── hobbs_current (decimal)
├── tach_current (decimal)
├── created_at

aircraft_members (partnership/club access)
├── aircraft_id → aircraft.id
├── user_id → users.id
├── role (owner | partner | member | readonly)
├── cost_share_pct (decimal, for fixed cost splitting)
├── joined_at

engines (component tracking)
├── id (uuid)
├── aircraft_id → aircraft.id
├── position (single | left | right)
├── make_model (e.g., "Continental O-470-U")
├── serial_number
├── tbo_hours (e.g., 2000)
├── tsmoh (time since major overhaul)
├── overhaul_cost_estimate (decimal)
├── last_oil_change_tach (decimal)
├── oil_change_interval_hours (e.g., 50)

flights (the logbook — core table)
├── id (uuid)
├── aircraft_id → aircraft.id
├── pilot_id → users.id
├── date
├── route_from (ICAO, e.g., "KSNA")
├── route_to (ICAO)
├── route_via (optional intermediate stops)
├── hobbs_start (decimal)
├── hobbs_end (decimal)
├── tach_start (decimal)
├── tach_end (decimal)
├── total_time (computed: hobbs_end - hobbs_start)
├── landings_day (int)
├── landings_night (int)
├── instrument_time (decimal)
├── instrument_approaches (int)
├── night_time (decimal)
├── cross_country (boolean)
├── pic_time (decimal)
├── sic_time (decimal)
├── dual_given (decimal)
├── dual_received (decimal)
├── conditions (VFR | IFR | SVFR)
├── remarks (text)
├── fuel_gallons (decimal, optional per-flight)
├── fuel_price_per_gallon (decimal)
├── fuel_total_cost (computed)
├── gpx_track (jsonb, optional imported track data)
├── created_at

expenses (fixed and variable costs)
├── id (uuid)
├── aircraft_id → aircraft.id
├── recorded_by → users.id
├── category (hangar | insurance | annual | maintenance | fuel | oil | subscription | other)
├── description (text)
├── amount (decimal)
├── date
├── is_recurring (boolean)
├── recurrence_interval (monthly | quarterly | annual)
├── receipt_url (text, Supabase Storage path)
├── created_at

maintenance_items (inspection/AD tracking)
├── id (uuid)
├── aircraft_id → aircraft.id
├── item_type (annual | 100hr | oil_change | elt | pitot_static | transponder | ad | custom)
├── description (text)
├── due_date (date, nullable)
├── due_tach_hours (decimal, nullable)
├── last_completed_date (date)
├── last_completed_tach (decimal)
├── interval_months (int, nullable)
├── interval_hours (decimal, nullable)
├── status (computed: green | yellow | red)
├── notes (text)

squawks (shared issue tracking for partnerships)
├── id (uuid)
├── aircraft_id → aircraft.id
├── reported_by → users.id
├── description (text)
├── severity (info | minor | major | grounding)
├── status (open | in_progress | resolved)
├── resolved_by → users.id
├── resolved_at (timestamp)
├── photos (text[], Supabase Storage paths)
├── created_at

currencies (pilot currency tracking)
├── id (uuid)
├── user_id → users.id
├── currency_type (day_vfr | night | ifr | flight_review | medical_1 | medical_2 | medical_3 | custom)
├── description (text, for custom currencies)
├── expires_at (date)
├── requirement_description (text)
├── auto_calculated (boolean)
```

### Computed Views / Functions

**Cost per hour** — Supabase database function:
- Fixed costs (hangar, insurance, subscriptions) amortized over trailing 12-month flight hours
- Variable costs (fuel, oil, maintenance) per hour
- Engine reserve accumulation (hours × reserve rate)
- Total fully-loaded cost per hour

**Currency status** — computed from flights table:
- Night currency: 3 full-stop landings in last 90 days (auto-calculated from flights)
- IFR currency: 6 approaches + holds in last 6 months
- Flight review: last entry with "flight review" in remarks + 24 months
- Medical: based on user-entered expiration date

**Partnership settlement** — computed per billing period:
- Each partner's share of fixed costs (by cost_share_pct)
- Each partner's variable costs (by their logged Hobbs hours)
- Net who-owes-whom for the period

### Folder Structure

```
tailwinds/
├── CLAUDE.md                  # AI operating manual
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (marketing)/       # Landing page, pricing
│   │   │   ├── page.tsx
│   │   │   └── pricing/
│   │   ├── (auth)/            # Login, signup, forgot password
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/       # Authenticated app
│   │   │   ├── layout.tsx     # Sidebar nav, auth guard
│   │   │   ├── page.tsx       # Dashboard home (currencies, recent flights, cost summary)
│   │   │   ├── logbook/       # Flight log list + entry form
│   │   │   ├── aircraft/      # Aircraft profile, engine tracking
│   │   │   ├── costs/         # Cost analytics dashboard
│   │   │   ├── maintenance/   # Maintenance status board
│   │   │   ├── squawks/       # Squawk board (partnership tier)
│   │   │   ├── partnership/   # Partner management, settlement
│   │   │   └── settings/      # Account, subscription, preferences
│   │   ├── api/
│   │   │   └── webhooks/
│   │   │       └── stripe/    # Stripe webhook handler
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # Shadcn/ui components
│   │   ├── logbook/           # FlightEntryForm, FlightList, FlightDetail
│   │   ├── aircraft/          # AircraftCard, EngineStatus, MaintenanceBoard
│   │   ├── costs/             # CostChart, CostBreakdown, CostPerHourCard
│   │   ├── currency/          # CurrencyDashboard, CurrencyItem
│   │   └── partnership/       # PartnerList, SettlementView, SquawkCard
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser Supabase client
│   │   │   ├── server.ts      # Server Supabase client
│   │   │   └── middleware.ts  # Auth middleware
│   │   ├── stripe/
│   │   │   └── config.ts      # Stripe product/price IDs
│   │   ├── utils/
│   │   │   ├── aviation.ts    # Airport lookup, time calculations
│   │   │   ├── currency.ts    # Currency calculation logic
│   │   │   └── costs.ts       # Cost computation helpers
│   │   └── constants.ts       # App-wide constants
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   └── migrations/        # Drizzle migration files
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons for PWA
├── supabase/
│   ├── config.toml            # Local Supabase config
│   └── migrations/            # SQL migrations (RLS policies, functions)
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Running Cost Estimate (Monthly)

| Service | Free Tier | At Scale (1K users) |
|---------|-----------|-------------------|
| Supabase | $0 | $25 (Pro) |
| Vercel | $0 | $20 (Pro) |
| Stripe | 2.9% + $0.30/txn | ~$250 in fees on ~$8K revenue |
| Resend | $0 | $0 (under 3K emails/month) |
| Domain | ~$15/year | ~$15/year |
| **Total** | **~$1.25/mo** | **~$46/mo + Stripe fees** |

---

## PART 2: PRODUCT SPECIFICATION

### Product Name Options

**Tailwinds** — Aviation term, positive connotation (faster, easier), memorable, domain-friendly
- tailwinds.aero, tailwindsapp.com, flytailwinds.com
- Alternative names if taken: Hangarmate, Preflight, Squawkbox, Hobbs, TailLog

### Tagline

"The ownership companion for aircraft owners."
"Know what your airplane actually costs."

### Target Users (Priority Order)

1. **Solo GA aircraft owners** — Own a piston single (Cessna, Piper, Beech), fly 50-200 hrs/year, currently track costs in a spreadsheet they haven't updated in 6 months. Your primary persona. This is you.

2. **Aircraft partnerships (2-4 partners)** — Co-own a plane, need transparent cost splitting and scheduling. Currently using shared Google Sheets and Venmo. The pain is acute and the willingness to pay is high.

3. **Small flying clubs (5-15 members)** — Need multi-aircraft management, member billing, and dispatch. Currently using Coflyt or spreadsheets. This is the high-ARPU tier.

### Subscription Tiers

**Free — $0/month**
- 1 aircraft
- Unlimited flight log entries
- Basic running totals (total time, PIC, landings)
- Currency tracking (day VFR, night, IFR, medical, flight review)
- CSV export
- This tier exists to get people in the door and build the logging habit

**Pilot — $9/month (or $89/year)**
- Everything in Free
- Full cost analytics dashboard (true cost per hour, trend charts, category breakdowns)
- Engine and component tracking (TBO countdown, oil change intervals, reserve accumulation)
- Maintenance status board (annual, 100hr, ADs, custom items — green/yellow/red)
- Receipt photo capture and storage
- Annual prep report (PDF for your A&P)
- Data import from ForeFlight, MyFlightbook, LogTen (CSV)
- PWA offline mode

**Partnership — $29/month (or $279/year)**
- Everything in Pilot
- Up to 6 users on a shared aircraft
- Usage-based cost splitting with configurable fixed/variable split
- Settlement reports (monthly or custom period)
- Shared squawk board with photo attachments
- Aircraft scheduling (simple calendar — who has the plane when)
- Partner activity feed
- Additional aircraft: +$10/month each

### MVP Scope (Layer 1 — Ship in 2 weekends)

The MVP is the free tier logbook + the cost engine hook. Just enough to be useful and differentiated.

**What ships:**
- Landing page with value prop, screenshot, and waitlist/signup
- Email/password auth (Supabase Auth) + Google OAuth
- Aircraft setup (tail number, make/model, home airport, Hobbs, tach)
- Flight entry form — the core interaction:
  - Date, from/to, Hobbs start/end, tach start/end
  - Auto-compute total time
  - Landings (day/night), conditions (VFR/IFR)
  - Instrument time, approaches, night time
  - Cross-country checkbox
  - Remarks text field
  - Optional: fuel gallons + price
- Flight log list view — sortable by date, filterable by aircraft
- Running totals dashboard — total time, PIC, landings, last 30/60/90 days
- Currency status — 4 cards showing green/yellow/red for night, IFR, flight review, medical
- Basic cost display — if fuel data entered, show fuel cost per flight and running average
- CSV import (MyFlightbook and ForeFlight export formats)
- CSV export (full logbook)
- Responsive design — works on phone at the hangar

**What does NOT ship in MVP:**
- Cost analytics dashboard (Layer 2)
- Engine/maintenance tracking (Layer 3)
- Partnership features (Layer 4)
- AI receipt scanning (Layer 5)
- Stripe/payments (add when Pilot tier features are ready)
- Native mobile app

### Layer 2 — The Cost Engine (Weeks 3-4)

This is the differentiator. No other logbook does this.

- Fixed cost setup screen (monthly amounts for hangar, insurance, annual estimate, subscriptions, loan payment)
- Auto-amortize fixed costs across flight hours
- Per-flight variable cost tracking (fuel from logbook entry, manual expense entry for maintenance/oil)
- **The number**: true fully-loaded cost per hour, displayed prominently on the dashboard
- Cost trend chart (cost per hour over trailing 12 months)
- Cost breakdown view (pie chart: fuel vs hangar vs insurance vs maintenance vs reserve)
- Simple expense entry form (amount, category, date, optional receipt photo)
- Engine reserve tracker — set TBO, overhaul estimate, and reserve rate; see accumulation vs target

This is when you add Stripe and the Pilot tier — users see the cost dashboard as a teaser on Free, full access requires Pilot subscription.

### Layer 3 — Maintenance Tracking (Month 2)

- Maintenance item setup (annual, 100hr, ELT, pitot-static, transponder check, oil change)
- Custom items (recurring ADs, any user-defined interval)
- Due tracking by calendar date AND/OR tach hours (whichever comes first)
- Color-coded status board (green = >30 days / >20% remaining, yellow = approaching, red = overdue)
- Push notifications / email alerts when items enter yellow status
- Annual prep report — one-page PDF summary:
  - Aircraft/engine total times
  - All maintenance item statuses
  - Outstanding squawks
  - Historical annual costs
  - Owner contact info and A&P notes field

### Layer 4 — Partnerships & Clubs (Month 3)

- Invite partners by email → they create accounts and see the shared aircraft
- Role-based access (owner manages settings, partners log flights and expenses)
- Configurable cost split:
  - Fixed costs: split evenly or by custom percentage
  - Variable costs: split by Hobbs usage
  - Manual override for one-off shared expenses
- Settlement period: monthly or custom date range
- Settlement report: clear "Partner A owes Partner B $X" output
- Shared squawk board:
  - Report an issue with severity level
  - Attach photos
  - Status tracking (open → in progress → resolved)
  - All partners notified of new squawks
- Simple scheduling calendar:
  - Reserve the aircraft for a date/time block
  - See who has it and when
  - No conflict — first-come, first-served with ability to message

### Layer 5 — AI Features (Month 4+)

- **Receipt scanning**: snap a photo of a fuel receipt → Claude Vision extracts gallons, PPG, airport, total cost → pre-fills expense entry
- **Invoice scanning**: snap a maintenance invoice → extracts line items, categorizes, updates maintenance timeline
- **Natural language search**: "When did I last fly to KSBA?" or "How many night landings in 2025?" → queries the logbook
- **Logbook OCR**: scan physical logbook pages → extract entries and import them
- **Cost forecasting**: "If I fly 100 hours next year, what will it cost?" → projection based on actual data

### Go-To-Market Strategy

**Phase 1: Dog-food it (weeks 1-4)**
- Use it yourself on N6049V for every flight
- Find 2-3 pilot friends willing to beta test
- Focus on making the logbook entry flow genuinely faster than alternatives

**Phase 2: Community launch (month 2)**
- Post on r/flying: "I'm a 182 owner who built an app to track what my plane actually costs. Here's what I found." Lead with the insight (your real cost-per-hour number), not the product.
- Post on Pilots of America forum — same angle
- This is the authentic builder story that pilot communities respond to

**Phase 3: Partnership wedge (month 3-4)**
- Find 3-5 partnerships or small clubs willing to try it
- The partnership billing feature sells itself — it eliminates spreadsheet friction
- Each partnership = 2-4 paying users acquired at once
- Flying clubs are the highest-LTV customers

**Phase 4: A&P channel (month 5+)**
- The annual prep report makes mechanics' lives easier
- Mechanics who like it will recommend it to their other customers
- "My A&P told me about it" is the most powerful referral in GA

### Design Direction

Aviation apps tend to look either:
(a) Like a 2008 desktop app (Pilot Partner, Logbook Pro)
(b) Like a generic SaaS dashboard (Coflyt)

Neither feels right. The design should feel like a **premium instrument panel** — dark mode default (pilots are used to dark UIs from EFBs), clean typography, data-dense but not cluttered, with the precision and trustworthiness of an avionics display. Think Garmin G1000 meets a modern fintech dashboard.

Key UI principles:
- The flight entry form must be completable in <30 seconds for a routine flight
- The dashboard should answer "am I legal to fly?" and "what does it cost?" at a glance
- Currency status should be immediately visible — green/yellow/red, no digging
- Dark mode first, light mode available
- Mobile-first responsive — most entries will happen on a phone at the hangar

### Competitive Positioning Matrix

| Feature | ForeFlight | LogTen Pro | MyFlightbook | Coflyt | **Tailwinds** |
|---------|-----------|-----------|-------------|--------|------------|
| Flight logging | ✓ (inaccurate auto) | ✓ (excellent) | ✓ (good, dated UI) | Basic | ✓ (fast, clean) |
| Currency tracking | ✓ | ✓ | ✓ (limited) | ✗ | ✓ |
| True cost/hour | ✗ | ✗ | ✗ | ✗ | **✓** |
| Cost analytics | ✗ | ✗ | ✗ | Basic | **✓** |
| Engine/TBO tracking | ✗ | ✗ | ✗ | ✓ | ✓ |
| Maintenance board | Basic | ✗ | ✗ | ✓ | ✓ |
| Partnership billing | ✗ | ✗ | ✗ | ✓ ($36/mo) | ✓ ($29/mo) |
| Squawk board | ✗ | ✗ | ✗ | ✓ | ✓ |
| AI receipt scanning | ✗ | ✗ | ✗ | ✗ | **✓ (future)** |
| Modern UI/UX | ✓ | ✓ (Apple only) | ✗ | Okay | **✓** |
| Price | $299/yr+ | $129/yr | Free | $10-36/mo | Free-$29/mo |
| Cross-platform | iOS only | Apple only | All | All | **All (PWA)** |

### Revenue Model Projections (Conservative)

| Milestone | Users | Paying | MRR | Timeline |
|-----------|-------|--------|-----|----------|
| Launch | 50 | 0 | $0 | Month 1-2 |
| Pilot tier live | 200 | 30 | $270 | Month 3-4 |
| Partnership tier live | 500 | 80 | $1,100 | Month 5-6 |
| Word of mouth growth | 1,000 | 200 | $2,800 | Month 9-12 |
| Established | 2,500 | 600 | $7,500 | Month 18-24 |

These are conservative — the GA owner community is ~150,000 active in the US. Capturing 1% = 1,500 users.

### Key Risks & Mitigations

**Risk: "I already use ForeFlight/LogTen, why switch?"**
→ Position as a complement, not replacement. "Keep ForeFlight for flying. Use Tailwinds for owning." The cost engine is something no logbook offers.

**Risk: Small TAM**
→ GA pilot-owners is a niche (~150K in US), but they spend freely on aviation tools ($300+/yr on ForeFlight alone). ARPU can be high. The partnership/club tier multiplies users per aircraft.

**Risk: Churn — people stop using it**
→ The logbook is the daily habit that drives retention. Maintenance reminders and currency tracking create "pull" — the app tells you things you need to know. Partnership billing creates lock-in.

**Risk: Coflyt adds cost tracking**
→ Your moat is the unified logbook + cost engine in a modern UX. Coflyt would have to rebuild from scratch. Plus, the AI features (Layer 5) are genuinely hard for a small aviation software company to replicate.
