import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tailwinds — Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
