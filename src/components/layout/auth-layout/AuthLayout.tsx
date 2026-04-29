"use client";

import type { ReactNode } from "react";
import tcoefsLogo from "../../../../tcoefs-logo.png";
import authImage from "../../../../portal_images/founder_holding_soil.jpeg";

/* ============================================================================
   AuthLayout
   60/40 two-column shell for all auth screens: Login, Register,
   Forgot Password, Reset Password.

   Structure:
     Left (60%)  .auth-panel   — dark institutional panel, V3 style.
                                 Grid texture, top green bar, mission copy.
                                 Hidden below 768px.
     Right (40%) .auth-form-zone — white/surface-dark zone, children slot.

   The left panel content is structural shell copy — the same across all
   auth screens. Form content lives entirely in {children}.
   ============================================================================ */

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="layout-auth">
      {/* ── Left: Institutional panel ─────────────────────────────────────── */}
      <div className="auth-panel" aria-hidden="true">
        <div
          className="auth-panel__photo"
          style={{ backgroundImage: `url(${authImage.src})` }}
        />

        {/* Subtle grid overlay */}
        <div className="auth-panel__grid" />

        {/* Green accent top bar */}
        <div className="auth-panel__top-bar" />

        {/* Logo — top of panel */}
        <div className="auth-panel__logo">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div className="auth-brand-image-mark">
              <img src={tcoefsLogo.src} alt="" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.1px",
                }}
              >
                TCoEFS Portal
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(168,212,168,0.45)",
                  letterSpacing: "0.3px",
                  lineHeight: 1,
                  marginTop: 1,
                }}
              >
                University of Jos, Nigeria
              </div>
            </div>
          </div>
        </div>

        {/* Mission copy — vertical center */}
        <div className="auth-panel__body">
          {/* Eyebrow */}
          <div className="auth-panel__eyebrow">
            <div className="auth-panel__eyebrow-line" />
            <span className="auth-panel__eyebrow-text">
              TETFund Centre of Excellence
            </span>
          </div>

          {/* Headline */}
          <h1 className="auth-panel__headline">
            Processing
            <br />
            <span className="auth-panel__headline-accent">futures.</span>
            <br />
            <span className="auth-panel__headline-sub">
              Not transactions.
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="auth-panel__subtext">
            Every document uploaded represents years of work.
            Every payment reference is a commitment.
          </p>
        </div>

        {/* Footer stats */}
        <div className="auth-panel__footer">
          {[
            { value: "6 Programmes", label: "NUC Accredited" },
            { value: "University of Jos", label: "Founded 1971" },
            { value: "TETFund CoE", label: "Food Security" },
          ].map((stat) => (
            <div key={stat.value}>
              <div className="auth-panel__footer-stat-value">{stat.value}</div>
              <div className="auth-panel__footer-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form zone ──────────────────────────────────────────────── */}
      <div className="auth-form-zone">
        {children}
      </div>
    </div>
  );
}
