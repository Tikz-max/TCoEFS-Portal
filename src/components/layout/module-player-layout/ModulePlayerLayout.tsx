"use client";

import type { ReactNode } from "react";
import { Navbar } from "../navbar/Navbar";
import type { LayoutUser } from "../types";

/* ============================================================================
   ModulePlayerLayout
   Three-column shell for the E-Learning module player.

   Structure:
     <header>  Navbar         — sticky, full-width, 64px
     <div>     .layout-module-player
       <aside>  Module nav     — 280px, scrollable, left column
       <main>   Content area   — flex-1, scrollable, bg-surface-dark
       <aside>  Assessment     — 320px, right column (quiz / results panel)
     </div>

   On mobile (< 768px): stacks vertically — module nav collapses to a
   scrollable strip, content and assessment stack below it.
   On tablet (< 1024px): assessment panel is hidden; the content zone
   fills the remaining width. Assessment surfaces in a drawer instead
   (wired by the page, not this shell).

   This layout is V3-aligned: the assessment panel is designed to host
   the quiz-results state (progress rings, pass/fail feedback, answer
   review, continue CTA). The actual quiz content lives in children —
   this is purely the structural container.
   ============================================================================ */

interface ModulePlayerLayoutProps {
  /** Authenticated user — drives navbar avatar */
  user?: LayoutUser | null;

  /**
   * Course completion percentage shown in the navbar progress bar.
   * 0–100. Omit to hide the progress bar.
   */
  courseProgress?: number;

  /**
   * Left column: module navigation panel.
   * Receives the course title, module list with status indicators,
   * and progress mini-stats. 280px wide.
   */
  moduleNav: ReactNode;

  /**
   * Center column: the primary learning content area.
   * Video player, text content, lesson body. Scrollable.
   */
  children: ReactNode;

  /**
   * Right column: the assessment/quiz panel.
   * Quiz questions, answer options, result state with progress rings.
   * 320px wide. Hidden below 1024px — surface via drawer on those widths.
   */
  assessmentPanel: ReactNode;
}

export function ModulePlayerLayout({
  user,
  courseProgress,
  moduleNav,
  children,
  assessmentPanel,
}: ModulePlayerLayoutProps) {
  const hasProgress =
    courseProgress !== undefined &&
    courseProgress >= 0 &&
    courseProgress <= 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--bg-surface-dark)",
      }}
    >
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <Navbar user={user} scrolled>
        {/* Course progress strip injected via the navbar's right action slot
            is handled by passing it as a notificationCount=0 + injecting the
            progress bar as a sibling — kept here as a portal-level concern */}
      </Navbar>

      {/* ── Course progress bar (full-width, below navbar) ───────────────── */}
      {hasProgress && (
        <div
          role="progressbar"
          aria-valuenow={courseProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Course progress: ${courseProgress}%`}
          style={{
            height: 3,
            background: "var(--border-subtle)",
            flexShrink: 0,
            position: "relative",
            zIndex: 99,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${courseProgress}%`,
              background:
                "linear-gradient(90deg, var(--green-medium), var(--green-primary))",
              borderRadius: "0 2px 2px 0",
              transition: "width var(--duration-slow) var(--ease-out)",
            }}
          />
        </div>
      )}

      {/* ── Three-column player ───────────────────────────────────────────── */}
      <div className="layout-module-player">
        {/* ── Module navigation panel (left) ───────────────────────────── */}
        <aside
          style={{
            background: "var(--bg-surface-default)",
            borderRight: "1px solid var(--border-subtle)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          aria-label="Module navigation"
        >
          {moduleNav}
        </aside>

        {/* ── Content area (center) ─────────────────────────────────────── */}
        <main
          id="module-content"
          tabIndex={-1}
          style={{
            background: "var(--bg-surface-dark)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          aria-label="Module content"
        >
          {children}
        </main>

        {/* ── Assessment panel (right) ──────────────────────────────────── */}
        <aside
          style={{
            background: "var(--bg-surface-default)",
            borderLeft: "1px solid var(--border-subtle)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          aria-label="Assessment panel"
        >
          {assessmentPanel}
        </aside>
      </div>
    </div>
  );
}
