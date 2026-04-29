import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { AdminTrainingRegistrationsManager } from "@/components/admin/training/AdminTrainingRegistrationsManager";
import {
  getAdminTrainingRegistrations,
  getTrainingAdminLayoutUser,
} from "@/features/training/workspace";

export default async function AdminTrainingRegistrationsPage() {
  let user;
  let registrations;
  try {
    [user, registrations] = await Promise.all([
      getTrainingAdminLayoutUser(),
      getAdminTrainingRegistrations(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/admin/training/registrations");
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
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Training admissions workspace</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>Training registrations</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Review participant registrations across all training programmes and approve or reject them from one queue.
          </p>
        </section>

        <AdminTrainingRegistrationsManager registrations={registrations} />
      </div>
    </DashboardLayout>
  );
}
