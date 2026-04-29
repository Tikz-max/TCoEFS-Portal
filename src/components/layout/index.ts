/* ============================================================================
   Layout Shells — Public API
   Import layout components from here. Never import directly from sub-folders.
   ============================================================================ */

export { Navbar } from "./navbar/Navbar";
export { Sidebar } from "./sidebar/Sidebar";
export { PublicLayout } from "./public-layout/PublicLayout";
export { AuthLayout } from "./auth-layout/AuthLayout";
export { DashboardLayout } from "./dashboard-layout/DashboardLayout";
export { ModulePlayerLayout } from "./module-player-layout/ModulePlayerLayout";
export { DetailPanel } from "./detail-panel/DetailPanel";
export { MobileBottomNav } from "./mobile-bottom-nav/MobileBottomNav";

export type {
  UserRole,
  LayoutUser,
  NavLink,
  SidebarItem,
  SidebarSection,
  PublicPage,
} from "./types";
export type { DetailPanelSectionProps } from "./detail-panel/DetailPanel";
