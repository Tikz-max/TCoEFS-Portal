/* ============================================================================
   Layout Shell — Shared Types
   All layout components import from here. Never define these inline.
   ============================================================================ */

/** Every authenticated role in the system */
export type UserRole =
  | "applicant"
  | "training_participant"
  | "elearning_participant"
  | "admin"
  | "admissions_officer"
  | "training_coordinator"
  | "e_learning_coordinator"
  | "super_admin";

/** Minimal user object threaded through layout shells */
export interface LayoutUser {
  name: string;
  /** Two-letter initials for the avatar */
  initials: string;
  role: UserRole;
  /** Human-readable role label rendered in the sidebar and navbar */
  roleLabel: string;
}

/** A single nav link — used in Navbar and MobileBottomNav */
export interface NavLink {
  key: string;
  label: string;
  href: string;
}

/** A single sidebar nav item */
export interface SidebarItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Pending-count badge. Omit or set to 0 to hide. */
  badge?: number;
}

/** A labeled group of sidebar items */
export interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

/** Public-facing page identifiers — used to set the active navbar link */
export type PublicPage =
  | "home"
  | "applications"
  | "training"
  | "elearning"
  | "help"
  | "contact";
