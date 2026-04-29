import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

/* ============================================================================
   404 — NOT FOUND
   Uses CSS custom properties from globals.css exclusively.
   No hard-coded color, spacing, or typography values.
   ============================================================================ */

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-surface-dark)",
        padding: "var(--space-8)",
        textAlign: "center",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Eyebrow */}
      <p
        style={{
          fontSize: "var(--text-label-size)",
          fontWeight: "var(--text-label-weight)",
          letterSpacing: "var(--text-label-spacing)",
          textTransform: "uppercase",
          color: "var(--green-primary)",
          marginBottom: "var(--space-3)",
        }}
      >
        404 — Page Not Found
      </p>

      {/* Headline */}
      <h1
        style={{
          fontSize: "var(--text-h1-size)",
          fontWeight: "var(--text-h1-weight)",
          lineHeight: "var(--text-h1-height)",
          letterSpacing: "var(--text-h1-spacing)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-4)",
          maxWidth: "560px",
        }}
      >
        This page doesn&apos;t exist
      </h1>

      {/* Body copy */}
      <p
        style={{
          fontSize: "var(--text-body-lg-size)",
          fontWeight: "var(--text-body-lg-weight)",
          lineHeight: "var(--text-body-lg-height)",
          color: "var(--text-secondary)",
          maxWidth: "480px",
          marginBottom: "var(--space-8)",
        }}
      >
        The address may have been typed incorrectly, or the page may have moved.
        Return to the portal home to continue.
      </p>

      {/* CTA — primary button via inline styles mirroring .btn-primary */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: "48px",
          padding: "0 var(--space-6)",
          borderRadius: "var(--radius-md)",
          background:
            "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
          color: "var(--text-on-green)",
          fontSize: "var(--text-btn-size)",
          fontWeight: "var(--text-btn-weight)",
          letterSpacing: "var(--text-btn-spacing)",
          textDecoration: "none",
          boxShadow: "var(--elevation-1)",
          transition:
            "box-shadow var(--duration-default) var(--ease-out), transform var(--duration-default) var(--ease-out)",
          fontFamily: "var(--font-sans)",
        }}
      >
        Return to Portal Home
      </Link>

      {/* Institutional footer note */}
      <p
        style={{
          fontSize: "var(--text-caption-size)",
          fontWeight: "var(--text-caption-weight)",
          letterSpacing: "var(--text-caption-spacing)",
          color: "var(--text-muted)",
          marginTop: "var(--space-12)",
        }}
      >
        TCoEFS Portal &mdash; TETFund Centre of Excellence in Food Security,
        University of Jos
      </p>
    </main>
  );
}
