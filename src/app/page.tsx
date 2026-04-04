import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tailwinds — Know what your airplane actually costs",
  description:
    "The ownership companion for GA aircraft owners. Flight logbook, cost tracking, maintenance management, and partnership billing — all in one app.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-bold">Tailwinds</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
        <p className="mb-3 text-sm font-medium text-primary">
          ForeFlight flies the plane. Tailwinds owns the plane.
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Know what your airplane
          <br />
          <span className="text-primary">actually costs</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          The flight logbook and ownership companion for GA aircraft owners.
          Log flights in seconds, track every dollar, and stay current — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Start logging for free
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
            Everything an aircraft owner needs
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<BookIcon />}
              title="Flight Logbook"
              description="Log flights in under 30 seconds. Auto-fill Hobbs and tach, track currency, and export to CSV anytime."
            />
            <FeatureCard
              icon={<ChartIcon />}
              title="Cost Tracking"
              description="See your true fully-loaded cost per hour. Track fuel, maintenance, hangar, insurance — every dollar."
              badge="Coming Soon"
            />
            <FeatureCard
              icon={<UsersIcon />}
              title="Partnerships"
              description="Split costs transparently with co-owners. Usage-based billing, shared squawk board, and settlement reports."
              badge="Coming Soon"
            />
          </div>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-muted-foreground">
            Built by a 182 owner who was tired of spreadsheets.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-8">
            <div>
              <p className="text-3xl font-bold">Free</p>
              <p className="text-xs text-muted-foreground">Unlimited flights</p>
            </div>
            <div>
              <p className="text-3xl font-bold">&lt;30s</p>
              <p className="text-xs text-muted-foreground">Per flight entry</p>
            </div>
            <div>
              <p className="text-3xl font-bold">PWA</p>
              <p className="text-xs text-muted-foreground">Works on any device</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold">Ready to know your real cost per hour?</h2>
          <p className="mt-2 text-muted-foreground">
            Free forever for flight logging. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Start logging for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm font-bold">Tailwinds</span>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">
                Sign up
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Tailwinds
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        {badge && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
