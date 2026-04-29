import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { AdminTrainingCatalogueManager } from "@/components/admin/training/AdminTrainingCatalogueManager";
import { getAdminTrainingList, getTrainingAdminLayoutUser } from "@/features/training/workspace";

export default async function AdminTrainingPage() {
  let user;
  let trainings;
  try {
    [user, trainings] = await Promise.all([
      getTrainingAdminLayoutUser(),
      getAdminTrainingList(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/admin/training");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="training">
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Admin training workspace</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>Training programmes</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Open a programme to manage its public catalogue entry, participant schedule, and downloadable workspace materials.
          </p>
        </section>

        <AdminTrainingCatalogueManager
          trainings={trainings}
          canManageProgrammes={user.role === "super_admin" || user.role === "admin"}
        />
      </div>
    </DashboardLayout>
  );
}
