import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./components.css";

/* ============================================================================
   ROOT LAYOUT
   Loads Geist fonts via the `geist` npm package (zero-config, self-hosted,
   matches tcoefs-unijos.org exactly). CSS variables are injected as class
   names on <html> and then referenced via var(--font-sans) / var(--font-mono)
   in globals.css — no hard-coded font-family strings in components.
   ============================================================================ */

export const metadata: Metadata = {
  title: {
    default: "TETFUND Centre of Excellence in Food Security Portal - University of Jos",
    template: "%s | TCoEFS Portal",
  },
  description:
    "Official digital operations portal for the TETFund Centre of Excellence in Food Security at the University of Jos, Nigeria. Postgraduate applications, training registration, and e-learning.",
  keywords: [
    "TCoEFS",
    "TETFUND Centre of Excellence",
    "University of Jos",
    "TETFund",
    "Food Security",
    "Postgraduate Applications",
    "Agricultural Training",
    "E-Learning",
    "Nigeria",
  ],
  authors: [{ name: "TCoEFS — University of Jos" }],
  creator: "TETFUND Centre of Excellence in Food Security",
  publisher: "TETFUND Centre of Excellence in Food Security - University of Jos",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.tcoefs-unijos.org",
  ),
openGraph: {
    type: "website",
    locale: "en_NG",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.tcoefs-unijos.org",
    siteName: "TCoEFS Portal",
    title: "TETFUND Centre of Excellence in Food Security Portal - University of Jos",
    description:
      "Official digital operations portal for the TETFUND Centre of Excellence in Food Security.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor:
    "#2D5A2D" /* --green-primary — the brand color as the browser chrome accent */,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5 /* allow zoom — accessibility requirement */,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * GeistSans.variable injects --font-geist-sans
     * GeistMono.variable injects --font-geist-mono
     *
     * globals.css maps these to the portal's own tokens:
     *   --font-sans: 'GeistSans', ...  (referenced via font-family: var(--font-sans))
     *   --font-mono: 'GeistMono', ...  (referenced via font-family: var(--font-mono))
     *
     * The html element itself uses font-family: var(--font-sans) via the
     * base reset in globals.css, so no additional className on <body> is needed.
     */
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
