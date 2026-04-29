"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardList,
  CheckCircle,
  BarChart3,
  Shield,
  Settings,
  Upload,
  Award,
  ListChecks,
  Activity,
} from "lucide-react";
import type { LayoutUser, UserRole } from "../types";

/* ============================================================================
   MobileBottomNav
   V2 — Structured 5-item bar with top indicator line.

   Replaces the sidebar below 768px for all authenticated roles.
   Shows the 5 most critical nav items for each role, selected from the
   full sidebar nav to match the user's most common journeys.

   Structure:
     .mobile-nav
       .mobile-nav__item (× 5)
         .mobile-nav__indicator  — top-edge green bar on active item
         .mobile-nav__icon       — lucide icon with optional badge dot
           .mobile-nav__badge    — pending count (omitted when 0)
         .mobile-nav__label      — item label

   Design direction: V2
   White background, 68px height, top green indicator bar on active tab,
   subtle shadow lifts it off the content below. Icon + label layout.
   Active item gets green icon + bold label. Inactive items are muted grey.

   Role determines which 5 items render. The same component handles all roles.
   ============================================================================ */

/* ── Per-role item definitions ───────────────────────────────────────────── */

interface MobileNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getItems(role: UserRole): MobileNavItem[] {
  switch (role) {
    case "applicant":
      return [
        {
          key: "overview",
          label: "Overview",
          href: "/applicant/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "application",
          label: "Application",
          href: "/applicant/application/1",
          icon: <FileText size={20} />,
        },
        {
          key: "documents",
          label: "Documents",
          href: "/applicant/documents",
          icon: <Upload size={20} />,
        },
        {
          key: "settings",
          label: "Help",
          href: "/applicant/help",
          icon: <Settings size={20} />,
        },
      ];

    case "training_participant":
      return [
        {
          key: "overview",
          label: "Overview",
          href: "/training/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "schedule",
          label: "Schedule",
          href: "/training/schedule",
          icon: <ListChecks size={20} />,
        },
        {
          key: "payment",
          label: "Payment",
          href: "/training/payment",
          icon: <CreditCard size={20} />,
        },
        {
          key: "materials",
          label: "Materials",
          href: "/training/materials",
          icon: <Settings size={20} />,
        },
        {
          key: "certificate",
          label: "Certificate",
          href: "/training/certificate",
          icon: <Award size={20} />,
        },
      ];

    case "elearning_participant":
      return [
        {
          key: "overview",
          label: "Overview",
          href: "/elearning/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "courses",
          label: "My Courses",
          href: "/elearning",
          icon: <BookOpen size={20} />,
        },
        {
          key: "progress",
          label: "Catalog",
          href: "/elearning",
          icon: <BarChart3 size={20} />,
        },
        {
          key: "certificates",
          label: "Certificates",
          href: "/elearning/certificates",
          icon: <Award size={20} />,
        },
        {
          key: "settings",
          label: "Status",
          href: "/elearning/dashboard",
          icon: <Settings size={20} />,
        },
      ];

    case "admin":
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "users",
          label: "Users",
          href: "/admin/users",
          icon: <Users size={20} />,
        },
        {
          key: "postgraduate",
          label: "Postgrad",
          href: "/admin/postgraduate",
          icon: <ClipboardList size={20} />,
        },
        {
          key: "training",
          label: "Training",
          href: "/admin/training",
          icon: <GraduationCap size={20} />,
        },
        {
          key: "elearning",
          label: "E-Learn",
          href: "/admin/elearning",
          icon: <BookOpen size={20} />,
        },
      ];

    case "admissions_officer":
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "postgraduate",
          label: "Postgrad",
          href: "/admin/postgraduate",
          icon: <ClipboardList size={20} />,
        },
      ];

    case "training_coordinator":
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "training",
          label: "Training",
          href: "/admin/training",
          icon: <GraduationCap size={20} />,
        },
      ];

    case "e_learning_coordinator":
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "elearning",
          label: "Courses",
          href: "/admin/elearning",
          icon: <BookOpen size={20} />,
        },
      ];

    case "super_admin":
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "users",
          label: "Users",
          href: "/admin/users",
          icon: <Users size={20} />,
        },
        {
          key: "postgraduate",
          label: "Postgrad",
          href: "/admin/postgraduate",
          icon: <ClipboardList size={20} />,
        },
        {
          key: "training",
          label: "Training",
          href: "/admin/training",
          icon: <GraduationCap size={20} />,
        },
        {
          key: "elearning",
          label: "E-Learn",
          href: "/admin/elearning",
          icon: <BookOpen size={20} />,
        },
      ];
  }
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface MobileBottomNavProps {
  /** Authenticated user — role determines which 5 items render */
  user: LayoutUser;

  /**
   * Key of the currently active nav item.
   * Matched against MobileNavItem.key.
   */
  activeItem?: string;

  /**
   * Badge counts keyed by item key.
   * Counts injected at runtime — omit or set to 0 to hide a badge.
   *
   * @example
   * badges={{ "review-queue": 7, "queue": 2 }}
   */
  badges?: Record<string, number>;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function MobileBottomNav({
  user,
  activeItem,
  badges = {},
}: MobileBottomNavProps) {
  const items = getItems(user.role);

  return (
    <nav
      className="mobile-nav"
      aria-label="Mobile navigation"
      role="navigation"
    >
      {items.map((item) => {
        const isActive = activeItem === item.key;
        const badgeCount = badges[item.key] ?? 0;
        const showBadge = badgeCount > 0;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`mobile-nav__item${isActive ? " mobile-nav__item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={
              showBadge
                ? `${item.label}, ${badgeCount} pending`
                : item.label
            }
          >
            {/* Top indicator bar — only visible on active item */}
            {isActive && (
              <span
                className="mobile-nav__indicator"
                aria-hidden="true"
              />
            )}

            {/* Icon with optional badge */}
            <span className="mobile-nav__icon" aria-hidden="true">
              {item.icon}
              {showBadge && (
                <span className="mobile-nav__badge" aria-hidden="true">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </span>

            {/* Label */}
            <span className="mobile-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
