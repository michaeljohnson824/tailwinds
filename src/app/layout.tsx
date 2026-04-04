import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Tailwinds — Aircraft Companion",
    template: "%s | Tailwinds",
  },
  description: "Flight logbook and cost tracking for pilots.",
  icons: {
    icon: "/favicon.svg",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "Tailwinds — Aircraft Companion",
    description: "Flight logbook and cost tracking for pilots.",
    siteName: "Tailwinds",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1628",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans antialiased", dmSans.variable)}>
      <body>{children}</body>
    </html>
  );
}
