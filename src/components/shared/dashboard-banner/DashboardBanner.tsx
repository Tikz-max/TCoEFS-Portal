"use client";

import type { ReactNode } from "react";
import type { UserRole } from "../../layout/types";

/* ============================================================================
   DashboardBanner
   Role-personalised welcome banner used at the top of every authenticated
   dashboard home screen.

   Structure:
     .dashboard-banner (green gradient, diagonal texture overlay)
       __left
         __greeting   — time-aware salutation + role context
         __name       — user's full name, large weight
         __status     — contextual status line (e.g. "Application under review")
         __stats      — quick-stat chips (3–4 key numbers)
       __cta          — primary action button relevant to the role

   The stats and CTA are optional — omit to render a simpler banner.
   ============================================================================ */

/* ── Stat chip ───────────────────────────────────────────────────────────── */

export interface BannerStat {
  value: string | number;
  label: string;
}

/* ── Props ───────────────────────────────────────────────────────────────── */

export interface DashboardBannerProps {
  /** User's display name */
  name: string;

  /** User's role — used to derive the greeting context line */
  role: UserRole;

  /**
   * Contextual status line beneath the name.
   * E.g. "Application submitted — awaiting document review"
   *      "3 active registrations · Next session: 14 July 2025"
   */
  statusLine?: string;

  /**
   * Quick-stat chips rendered along the bottom of the left column.
   * Keep to 3–4 for visual balance.
   */
  stats?: BannerStat[];

  /**
   * Primary CTA rendered in the right column.
   * Typically a <button> or <Link> wrapped in a btn class.
   * Omit to render without a right-column action.
   */
  cta?: ReactNode;
}

/* ── Role greeting map ───────────────────────────────────────────────────── */

function getRoleGreetingContext(role: UserRole): string {
  switch (role) {
    case "applicant":
      return "Postgraduate Applicant";
    case "training_participant":
      return "Training Participant";
    case "elearning_participant":
      return "E-Learning Participant";
    case "admissions_officer":
      return "Admissions Officer";
    case "training_coordinator":
      return "Training Coordinator";
    case "admin":
      return "Admin";
    case "e_learning_coordinator":
      return "E-Learning Coordinator";
    case "super_admin":
      return "Super Administrator";
  }
}

/* ── Time-aware greeting ─────────────────────────────────────────────────── */

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function DashboardBanner({
  name,
  role,
  statusLine,
  stats,
  cta,
}: DashboardBannerProps) {
  const greeting = getTimeGreeting();
  const context = getRoleGreetingContext(role);
  const firstName = name.split(" ")[0];

  return (
    <div className="dashboard-banner" role="banner" aria-label="Welcome banner">
      {/* ── Left column ────────────────────────────────────────────────── */}
      <div className="dashboard-banner__left">
        {/* Greeting + role context */}
        <div className="dashboard-banner__greeting">
          {greeting} · {context}
        </div>

        {/* Name */}
        <div
          className="dashboard-banner__name"
          aria-label={`Welcome, ${name}`}
        >
          {firstName}.
        </div>

        {/* Status line */}
        {statusLine && (
          <div className="dashboard-banner__status">{statusLine}</div>
        )}

        {/* Quick stats */}
        {stats && stats.length > 0 && (
          <div
            className="dashboard-banner__stats"
            role="list"
            aria-label="Quick stats"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="dashboard-banner__stat"
                role="listitem"
              >
                <div className="dashboard-banner__stat-value">
                  {stat.value}
                </div>
                <div className="dashboard-banner__stat-label">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA column ─────────────────────────────────────────────────── */}
      {cta && (
        <div className="dashboard-banner__cta" aria-label="Primary action">
          {cta}
        </div>
      )}
    </div>
  );
}

/* ── Preset stat builders ────────────────────────────────────────────────── */

/** Applicant dashboard stats */
export function buildApplicantStats(opts: {
  stepsComplete: number;
  totalSteps: number;
  docsUploaded: number;
  totalDocs: number;
  daysRemaining?: number;
}): BannerStat[] {
  const stats: BannerStat[] = [
    {
      value: `${opts.stepsComplete}/${opts.totalSteps}`,
      label: "Steps Complete",
    },
    {
      value: `${opts.docsUploaded}/${opts.totalDocs}`,
      label: "Docs Uploaded",
    },
  ];
  if (opts.daysRemaining !== undefined) {
    stats.push({
      value: opts.daysRemaining,
      label: "Days Remaining",
    });
  }
  return stats;
}

/** Training participant stats */
export function buildTrainingStats(opts: {
  registrations: number;
  attended: number;
  upcoming: number;
}): BannerStat[] {
  return [
    { value: opts.registrations, label: "Registered" },
    { value: opts.attended, label: "Attended" },
    { value: opts.upcoming, label: "Upcoming" },
  ];
}

/** E-learning participant stats */
export function buildElearningStats(opts: {
  courses: number;
  completed: number;
  certificates: number;
  avgProgress: number;
}): BannerStat[] {
  return [
    { value: opts.courses, label: "Courses" },
    { value: opts.completed, label: "Completed" },
    { value: opts.certificates, label: "Certificates" },
    { value: `${opts.avgProgress}%`, label: "Avg Progress" },
  ];
}

/** Admin / coordinator stats */
export function buildAdminStats(opts: {
  pending: number;
  pendingLabel: string;
  total: number;
  totalLabel: string;
  extra?: { value: string | number; label: string };
}): BannerStat[] {
  const stats: BannerStat[] = [
    { value: opts.pending, label: opts.pendingLabel },
    { value: opts.total, label: opts.totalLabel },
  ];
  if (opts.extra) stats.push(opts.extra);
  return stats;
}
