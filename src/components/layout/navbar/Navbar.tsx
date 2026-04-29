"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import tcoefsLogo from "../../../../tcoefs-logo.png";
import type { LayoutUser, PublicPage } from "../types";

/* ============================================================================
   Navbar
   Public and authenticated. Role-agnostic — the same nav renders for all
   authenticated users (the sidebar handles role-specific navigation).

   Design direction: V2 — structured, scrolled-state elevation, breadcrumb
   sub-bar available. White background, green active underline, user pill.
   ============================================================================ */

const PUBLIC_LINKS: { key: PublicPage; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "applications", label: "Postgraduate", href: "/postgraduate" },
  { key: "training", label: "Training", href: "/training" },
  { key: "elearning", label: "E-Learning", href: "/elearning" },
  { key: "help", label: "Help", href: "/help" },
  { key: "contact", label: "Contact", href: "/contact" },
];

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface NavbarProps {
  /**
   * Which public page link should be highlighted as active.
   * Omit on authenticated screens — the sidebar owns active state there.
   */
  activePage?: PublicPage;

  /**
   * Authenticated user. When provided the Login / Apply Now CTAs are replaced
   * with a notification bell and user-avatar pill. When null or undefined the
   * public CTA buttons are shown.
   */
  user?: LayoutUser | null;

  /** Unread notification count. Badge is hidden when 0. */
  notificationCount?: number;

  /**
   * When true the navbar renders with the elevated scrolled shadow.
   * Wire this to a scroll listener on the page — or use the `useNavScroll`
   * hook exported from this module.
   */
  scrolled?: boolean;

  /**
   * Optional breadcrumb trail rendered in the 34px sub-bar below the main
   * navbar row. Omit to hide the sub-bar entirely.
   *
   * @example
   * breadcrumb={[
   *   { label: "Portal Home", href: "/" },
   *   { label: "Postgraduate Applications" },
   * ]}
   */
  breadcrumb?: BreadcrumbItem[];
}

export function Navbar({
  activePage,
  user,
  scrolled = false,
  breadcrumb,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = "public-mobile-menu";

  return (
    <header>
      <nav
        className={`navbar${scrolled ? " navbar--scrolled" : ""}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link
          href="/"
          className="navbar__logo"
          aria-label="TCoEFS Portal — Home"
        >
          <div className="navbar__logo-mark" aria-hidden="true">
            <img src={tcoefsLogo.src} alt="" className="navbar__logo-image" />
          </div>
          <div>
            <div className="navbar__brand-text">TCoEFS Portal</div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.2px",
                lineHeight: 1,
                marginTop: 1,
              }}
            >
              University of Jos
            </div>
          </div>
        </Link>

        {/* ── Navigation links (hidden on mobile — sidebar / mobile-nav takes over) */}
        <ul className="navbar__links" role="list" aria-label="Site navigation">
          {PUBLIC_LINKS.map(({ key, label, href }) => (
            <li key={key}>
              <Link
                href={href}
                className={`navbar__link${activePage === key ? " navbar__link--active" : ""}`}
                aria-current={activePage === key ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="navbar__actions">
          {user ? (
            <>
              {/* User pill */}
              <button
                className="navbar__user"
                aria-label="Open account menu"
                aria-haspopup="menu"
              >
                <div className="navbar__user-avatar" aria-hidden="true">
                  {user.initials}
                </div>
                <span className="navbar__user-name">
                  {/* Show first name only to save space */}
                  {user.name.split(" ")[0]}
                </span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary btn-sm navbar__desktop-cta">
                Login
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm navbar__desktop-cta">
                Apply Now
              </Link>
            </>
          )}
          <button
            type="button"
            className="navbar__mobile-toggle"
            aria-label={mobileOpen ? "Close mobile navigation" : "Open mobile navigation"}
            aria-expanded={mobileOpen}
            aria-controls={mobileMenuId}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div
        id={mobileMenuId}
        className={`navbar__mobile-menu${mobileOpen ? " navbar__mobile-menu--open" : ""}`}
      >
        <div className="navbar__mobile-menu-inner">
          {PUBLIC_LINKS.map(({ key, label, href }) => (
            <Link
              key={key}
              href={href}
              className={`navbar__mobile-link${activePage === key ? " navbar__mobile-link--active" : ""}`}
              aria-current={activePage === key ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span>{label}</span>
              {activePage === key && <span className="navbar__mobile-current">Current</span>}
            </Link>
          ))}
          {!user && (
            <div className="navbar__mobile-actions">
              <Link href="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
                Apply Now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Breadcrumb sub-bar (V2 — optional) ──────────────────────────────── */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div
          style={{
            height: 34,
            background: "var(--bg-surface-dark)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            padding: "0 var(--space-8)",
          }}
          aria-label="Breadcrumb"
        >
          <ol className="breadcrumb" role="list">
            {breadcrumb.map((crumb, i) => {
              const isLast = i === breadcrumb.length - 1;
              return (
                <li key={i} className="breadcrumb__item">
                  {isLast ? (
                    <span aria-current="page">{crumb.label}</span>
                  ) : (
                    <>
                      <Link
                        href={crumb.href ?? "#"}
                        className="breadcrumb__link"
                      >
                        {crumb.label}
                      </Link>
                      <span
                        className="breadcrumb__separator"
                        aria-hidden="true"
                      >
                        /
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </header>
  );
}
