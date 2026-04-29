"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { Navbar } from "../navbar/Navbar";
import { Sidebar } from "../sidebar/Sidebar";
import type { LayoutUser } from "../types";

/* ============================================================================
   DashboardLayout
   Three-zone authenticated shell for all dashboard screens.

   Structure:
     <header>  Navbar   — sticky, full-width, 64px height
     <div>
       <aside>  Sidebar  — sticky, 240px, role-based nav
       <main>   content-zone — scrollable, flex-1
       <aside>  detail-panel — optional, 320px, right column
     </div>

   The navbar handles auth state. The sidebar handles role navigation.
   Content and detail panel are pure children slots — no page content here.

   On mobile (< 768px):
   - Sidebar collapses to a CSS-driven bottom bar (see components.css)
   - Detail panel becomes a fixed bottom sheet (detail-panel--open toggle)
   - MobileBottomNav component is the recommended replacement for sidebar
   ============================================================================ */

interface DashboardLayoutProps {
  /** Authenticated user — drives sidebar role nav and navbar avatar */
  user: LayoutUser;

  /** Main scrollable content zone */
  children: ReactNode;

  /**
   * Optional right-column detail panel content.
   * When provided, the detail panel column is rendered.
   * When omitted, the content zone stretches to fill the full width.
   */
  detailPanel?: ReactNode;

  /**
   * Controls the mobile bottom-sheet state of the detail panel.
   * Only relevant below 768px — the CSS class `detail-panel--open`
   * is applied when true.
   */
  detailPanelOpen?: boolean;

  /** Currently active sidebar item key */
  activeItem?: string;

  /** Unread notification count shown in navbar bell */
  notificationCount?: number;

  /**
   * Per-item badge counts injected at runtime.
   * Keyed by SidebarItem.key.
   *
   * @example
   * badges={{ "review-queue": 14, payments: 3 }}
   */
  badges?: Record<string, number>;

  onSignOut?: () => void;
  showNavbar?: boolean;
  mobileSidebarMode?: "bottom-nav" | "drawer";
  mobileMenuLabel?: string;
}

export function DashboardLayout({
  user,
  children,
  detailPanel,
  detailPanelOpen = false,
  activeItem,
  notificationCount = 0,
  badges = {},
  onSignOut,
  showNavbar = true,
  mobileSidebarMode = "bottom-nav",
  mobileMenuLabel = "Workspace Menu",
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={`dashboard-shell${showNavbar ? "" : " dashboard-shell--without-navbar"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--bg-surface-dark)",
      }}
    >
      {/* ── Navbar — sticky, full width ──────────────────────────────────────── */}
      {showNavbar ? (
        <Navbar
          user={user}
          notificationCount={notificationCount}
          scrolled
        />
      ) : (
        <div className="workspace-shell__topbar">
          <button
            type="button"
            className="workspace-shell__menu-button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close workspace menu" : "Open workspace menu"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="workspace-shell__title">{mobileMenuLabel}</div>
        </div>
      )}

      {/* ── Three-zone body ──────────────────────────────────────────────────── */}
      <div className={`layout-dashboard${!showNavbar ? " layout-dashboard--without-navbar" : ""}${mobileSidebarMode === "drawer" ? " layout-dashboard--drawer-nav" : ""}`}>
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        {mobileSidebarMode === "drawer" && sidebarOpen ? (
          <button
            type="button"
            className="workspace-shell__overlay"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close workspace menu overlay"
          />
        ) : null}
        <Sidebar
          user={user}
          activeItem={activeItem}
          badges={badges}
          onSignOut={onSignOut}
          className={mobileSidebarMode === "drawer" ? `sidebar--drawer${sidebarOpen ? " sidebar--open" : ""}` : undefined}
        />

        {/* ── Primary content zone ─────────────────────────────────────────── */}
        <main
          className="content-zone"
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}
        </main>

        {/* ── Detail panel (optional) ──────────────────────────────────────── */}
        {detailPanel !== undefined && (
          <aside
            className={`detail-panel${detailPanelOpen ? " detail-panel--open" : ""}`}
            aria-label="Detail panel"
          >
            {detailPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
