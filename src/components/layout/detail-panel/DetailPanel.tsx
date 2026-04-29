"use client";

import type { ReactNode } from "react";
import { X, GripHorizontal } from "lucide-react";

/* ============================================================================
   DetailPanel
   Right-column panel shell for the three-zone authenticated layout.

   Desktop (≥ 768px):
     Renders as a sticky 320px right column inside .layout-dashboard.
     The .detail-panel CSS class from components.css governs the width,
     border, background, and overflow.

   Mobile (< 768px):
     Becomes a CSS-driven bottom sheet. The parent (DashboardLayout) applies
     .detail-panel--open to transform it into view. This component provides
     the visual affordances: drag handle, close button, scrollable body.

   Usage:
     Pass any content as children. Wrap logical sections with
     <DetailPanel.Section> for consistent spacing and optional section labels.

   Props:
     title       — panel header title (e.g. "Application Checklist")
     subtitle    — optional secondary descriptor below the title
     onClose     — fires when the close / dismiss button is pressed.
                   Required for the mobile bottom-sheet dismiss affordance.
                   On desktop, the panel is always visible — onClose can be
                   used to clear the selection / collapse the column.
     isOpen      — bottom-sheet open state below 768px. Mapped to
                   .detail-panel--open. Irrelevant on desktop.
     hideHandle  — suppress the mobile drag-handle (e.g. if the panel is
                   always-open and not dismissible).
   ============================================================================ */

/* ── Sub-component: Section ──────────────────────────────────────────────── */

interface DetailPanelSectionProps {
  /** Optional section label rendered as an uppercase overline */
  label?: string;
  children: ReactNode;
}

function DetailPanelSection({ label, children }: DetailPanelSectionProps) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            paddingBottom: "var(--space-2)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {label}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Sub-component: Divider ──────────────────────────────────────────────── */

function DetailPanelDivider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid var(--border-subtle)",
        margin: 0,
        flexShrink: 0,
      }}
    />
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

interface DetailPanelProps {
  /** Panel heading */
  title: string;

  /** Optional one-liner below the title */
  subtitle?: string;

  /** Called when the ✕ button or mobile close affordance is pressed */
  onClose?: () => void;

  /**
   * Controls the mobile bottom-sheet open state.
   * Adds .detail-panel--open when true, which animates the panel up.
   * Has no visual effect on desktop.
   */
  isOpen?: boolean;

  /**
   * Suppress the mobile drag-handle pill.
   * Use when the panel is always visible and non-dismissible.
   */
  hideHandle?: boolean;

  children: ReactNode;
}

export function DetailPanel({
  title,
  subtitle,
  onClose,
  isOpen = false,
  hideHandle = false,
  children,
}: DetailPanelProps) {
  return (
    <aside
      className={`detail-panel${isOpen ? " detail-panel--open" : ""}`}
      aria-label={title}
    >
      {/* ── Mobile drag handle ──────────────────────────────────────────── */}
      {!hideHandle && (
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: "var(--space-3)",
            flexShrink: 0,
            /* Only visible on mobile via CSS — hidden on desktop */
            /* We use a class so components.css media query can hide it */
          }}
          className="detail-panel__handle-row"
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: "var(--radius-full)",
              background: "var(--border-default)",
            }}
          />
        </div>
      )}

      {/* ── Panel header ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              letterSpacing: "-0.1px",
              margin: 0,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: "var(--space-1)",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Close / dismiss button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              width: 28,
              height: 28,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
              transition:
                "color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-primary)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-surface-raised)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Divider below header ────────────────────────────────────────── */}
      <DetailPanelDivider />

      {/* ── Scrollable content body ─────────────────────────────────────── */}
      {/*
        Note: .detail-panel already has overflow-y: auto and display: flex +
        flex-direction: column + gap: space-6. Children render as flex children.
        For section grouping, use <DetailPanel.Section>.
      */}
      {children}
    </aside>
  );
}

/* ── Attach sub-components as static properties ──────────────────────────── */
DetailPanel.Section = DetailPanelSection;
DetailPanel.Divider = DetailPanelDivider;

/* ── Convenience re-export of sub-component types ────────────────────────── */
export type { DetailPanelSectionProps };
