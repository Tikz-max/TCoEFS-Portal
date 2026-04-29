"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Navbar } from "../navbar/Navbar";
import type { LayoutUser, PublicPage } from "../types";

/* ============================================================================
   PublicLayout
   Shell for every public-facing page: Home, Applications, Training,
   E-Learning, Help, Contact.

   Structure:
     <header> Navbar (white, V2 style)
     <main>   {children}  — full-width, no max-width imposed here.
                            Individual page sections apply .layout-container
                            when they need centering. Hero sections that need
                            full-bleed dark backgrounds render without it.
     <footer> Dark institutional footer (V3 style)

   The nav and footer are part of the shell. Page content is entirely in
   children. No page content lives here.
   ============================================================================ */

interface PublicLayoutProps {
  children: ReactNode;

  /** Highlights the matching navbar link */
  activePage?: PublicPage;

  /**
   * When an authenticated user visits a public page (e.g. from a direct link),
   * pass their session here to show the user pill instead of Login / Apply Now.
   */
  user?: LayoutUser | null;

  /** Unread notification count — only relevant when `user` is provided */
  notificationCount?: number;
}

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Contact", href: "/contact" },
  { label: "Help", href: "/help" },
];

export function PublicLayout({
  children,
  activePage,
  user,
  notificationCount = 0,
}: PublicLayoutProps) {
  return (
    <div className="layout-public">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <Navbar
        activePage={activePage}
        user={user}
        notificationCount={notificationCount}
      />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="footer" aria-label="Site footer">
        <div className="footer__brand">
          <Leaf
            size={12}
            color="rgba(168,212,168,0.35)"
            aria-hidden="true"
          />
          <span className="footer__brand-text">
            TCoEFS · University of Jos · TETFund
          </span>
        </div>

        <nav className="footer__links" aria-label="Footer navigation">
          {FOOTER_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="footer__link">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
