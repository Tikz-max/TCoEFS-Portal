import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { AdminPostgraduateCatalogueManager } from "@/components/admin/postgraduate/AdminPostgraduateCatalogueManager";
import {
  getAdminPostgraduateProgrammes,
  getPostgraduateAdminLayoutUser,
} from "@/features/postgraduate/catalogue";

export default async function AdminPostgraduatePage() {
  let user;
  let programmes;
  try {
    [user, programmes] = await Promise.all([
      getPostgraduateAdminLayoutUser(),
      getAdminPostgraduateProgrammes(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/admin/postgraduate");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="postgraduate">
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Postgraduate catalogue</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>Postgraduate programmes</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Manage the public postgraduate catalogue and keep application-facing programme details current.
          </p>
        </section>

        <AdminPostgraduateCatalogueManager programmes={programmes} canDelete={user.role === "super_admin" || user.role === "admin"} />
      </div>
    </DashboardLayout>
  );
}
