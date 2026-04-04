import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tailwinds — Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link href="/" className="text-lg font-bold hover:text-primary transition-colors">
            Tailwinds
          </Link>
        </div>
      </header>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
