"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Upload,
  CreditCard,
  BookOpen,
  Award,
  Users,
  CheckCircle,
  Clipboard,
  BarChart3,
  GraduationCap,
  BookMarked,
  PenLine,
  UserCog,
  Activity,
  LogOut,
} from "lucide-react";
import tcoefsLogo from "../../../../tcoefs-logo.png";
import type { LayoutUser, UserRole, SidebarSection } from "../types";
import { signOutAndRedirect } from "@/lib/auth/client-signout";

/* ============================================================================
   Sidebar
   Single component — role prop determines which sections and items render.
   Visual treatment is identical across all roles (V2: white, structured,
   section-labelled, green active state).

   The sidebar is sticky and sits inside the three-zone dashboard layout.
   On mobile (< 768px) the CSS collapses it into a bottom navigation bar —
   the MobileBottomNav component is the dedicated replacement for that context.
   ============================================================================ */

/* ── Role → nav sections map ─────────────────────────────────────────────── */

function getSections(role: UserRole): SidebarSection[] {
  switch (role) {
    case "applicant":
      return [
        {
          label: "MY PORTAL",
          items: [
            {
              key: "overview",
              label: "Overview",
              href: "/applicant/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
            {
              key: "application",
              label: "My Application",
              href: "/applicant/application/1",
              icon: <FileText size={16} />,
            },
            {
              key: "documents",
              label: "Documents",
              href: "/applicant/documents",
              icon: <Upload size={16} />,
            },
          ],
        },
      ];

    case "training_participant":
      return [
        {
          label: "MY PORTAL",
          items: [
            {
              key: "overview",
              label: "Overview",
              href: "/training/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
            {
              key: "schedule",
              label: "Schedule",
              href: "/training/schedule",
              icon: <BookOpen size={16} />,
            },
            {
              key: "payment",
              label: "Payment",
              href: "/training/payment",
              icon: <CreditCard size={16} />,
            },
            {
              key: "materials",
              label: "Materials",
              href: "/training/materials",
              icon: <Upload size={16} />,
            },
            {
              key: "certificate",
              label: "Certificate",
              href: "/training/certificate",
              icon: <Award size={16} />,
            },
          ],
        },
      ];

    case "elearning_participant":
      return [
        {
          label: "MY PORTAL",
          items: [
            {
              key: "overview",
              label: "Overview",
              href: "/elearning/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
            {
              key: "courses",
              label: "My Courses",
              href: "/elearning",
              icon: <BookOpen size={16} />,
            },
            {
              key: "certificates",
              label: "Certificates",
              href: "/elearning/certificates",
              icon: <Award size={16} />,
            },
          ],
        },
      ];

    case "admin":
      return [
        {
          label: "OVERVIEW",
          items: [
            {
              key: "dashboard",
              label: "Dashboard",
              href: "/admin/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
          ],
        },
        {
          label: "MANAGEMENT",
          items: [
            {
              key: "users",
              label: "Users",
              href: "/admin/users",
              icon: <Users size={16} />,
            },
            {
              key: "postgraduate",
              label: "Postgraduate",
              href: "/admin/postgraduate",
              icon: <Clipboard size={16} />,
            },
            {
              key: "training",
              label: "Training",
              href: "/admin/training",
              icon: <GraduationCap size={16} />,
            },
            {
              key: "elearning",
              label: "E-Learning",
              href: "/admin/elearning",
              icon: <BookMarked size={16} />,
            },
          ],
        },
      ];

    case "admissions_officer":
      return [
        {
          label: "OVERVIEW",
          items: [
            {
              key: "dashboard",
              label: "Dashboard",
              href: "/admin/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
          ],
        },
        {
          label: "POSTGRADUATE",
          items: [
            {
              key: "postgraduate",
              label: "Postgraduate",
              href: "/admin/postgraduate",
              icon: <Clipboard size={16} />,
            },
          ],
        },
      ];

    case "training_coordinator":
      return [
        {
          label: "OVERVIEW",
          items: [
            {
              key: "dashboard",
              label: "Dashboard",
              href: "/admin/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
          ],
        },
        {
          label: "TRAINING",
          items: [
            {
              key: "training",
              label: "Training",
              href: "/admin/training",
              icon: <GraduationCap size={16} />,
            },
          ],
        },
      ];

    case "e_learning_coordinator":
      return [
        {
          label: "OVERVIEW",
          items: [
            {
              key: "dashboard",
              label: "Dashboard",
              href: "/admin/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
          ],
        },
        {
          label: "E-LEARNING",
          items: [
            {
              key: "elearning",
              label: "Courses",
              href: "/admin/elearning",
              icon: <BookOpen size={16} />,
            },
          ],
        },
      ];

    case "super_admin":
      return [
        {
          label: "OVERVIEW",
          items: [
            {
              key: "dashboard",
              label: "Dashboard",
              href: "/admin/dashboard",
              icon: <LayoutDashboard size={16} />,
            },
          ],
        },
        {
          label: "MANAGEMENT",
          items: [
            {
              key: "users",
              label: "Users",
              href: "/admin/users",
              icon: <Users size={16} />,
            },
            {
              key: "postgraduate",
              label: "Postgraduate",
              href: "/admin/postgraduate",
              icon: <Clipboard size={16} />,
            },
            {
              key: "training",
              label: "Training",
              href: "/admin/training",
              icon: <GraduationCap size={16} />,
            },
            {
              key: "elearning",
              label: "E-Learning",
              href: "/admin/elearning",
              icon: <BookMarked size={16} />,
            },
          ],
        },
      ];
  }
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface SidebarProps {
  user: LayoutUser;
  /** Currently active item key — matched against SidebarItem.key */
  activeItem?: string;
  /**
   * Badge counts keyed by SidebarItem.key.
   * Counts are injected at runtime (e.g. from API) rather than baked in.
   *
   * @example
   * badges={{ "review-queue": 14, "payments": 3 }}
   */
  badges?: Record<string, number>;
  onSignOut?: () => void;
  className?: string;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function Sidebar({
  user,
  activeItem,
  badges = {},
  onSignOut,
  className,
}: SidebarProps) {
  const router = useRouter();
  const sections = getSections(user.role);
  const handleSignOut = onSignOut ?? (() => signOutAndRedirect(router));

  return (
    <aside className={`sidebar${className ? ` ${className}` : ""}`} aria-label="Main navigation">
      {/* ── Logo area ─────────────────────────────────────────────────────── */}
      <div className="sidebar__logo-area">
        <Link
          href="/"
          className="sidebar__brand"
          aria-label="TCoEFS Portal — Home"
        >
          <div className="sidebar__brand-mark" aria-hidden="true">
            <img src={tcoefsLogo.src} alt="" className="sidebar__brand-image" />
          </div>
          <div>
            <div className="sidebar__brand-title">TCoEFS Portal</div>
            <div className="sidebar__brand-subtitle">University of Jos</div>
          </div>
        </Link>
      </div>

      {/* ── User block ────────────────────────────────────────────────────── */}
      <div className="sidebar__user-block">
        <div className="sidebar__user-avatar" aria-hidden="true">
          {user.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="sidebar__user-name">{user.name}</div>
          <div className="sidebar__user-role">{user.roleLabel}</div>
        </div>
      </div>

      {/* ── Nav sections ──────────────────────────────────────────────────── */}
      <nav
        style={{ flex: 1, overflow: "hidden" }}
        aria-label="Sidebar navigation"
      >
        {sections.map((section) => (
          <div key={section.label}>
            <div className="sidebar__section-label" aria-hidden="true">
              {section.label}
            </div>

            {section.items.map((item) => {
              const isActive = activeItem === item.key;
              const badge = badges[item.key] ?? item.badge ?? 0;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`sidebar__item${isActive ? " sidebar__item--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="sidebar__item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>

                  {/* Badge — pending count */}
                  {badge > 0 && (
                    <span
                      className="sidebar__item-badge"
                      aria-label={`${badge} pending`}
                      style={
                        isActive
                          ? {
                              background: "rgba(255,255,255,0.22)",
                              color: "white",
                            }
                          : undefined
                      }
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom section ────────────────────────────────────────────────── */}
      <div className="sidebar__bottom">
        <button
          onClick={handleSignOut}
          className="sidebar__item"
          style={{ color: "var(--status-error-text)", width: "100%" }}
          aria-label="Sign out of TCoEFS Portal"
        >
          <span
            className="sidebar__item-icon"
            aria-hidden="true"
            style={{ opacity: 0.7 }}
          >
            <LogOut size={16} />
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
