import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { AdminTrainingDetailWorkspace } from "@/components/admin/training/AdminTrainingDetailWorkspace";
import { getAdminTrainingDetail, getTrainingAdminLayoutUser } from "@/features/training/workspace";

export default async function AdminTrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  let user;
  let detail;
  try {
    [user, detail] = await Promise.all([
      getTrainingAdminLayoutUser(),
      getAdminTrainingDetail(resolvedParams.id),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect(`/login?redirect=/admin/training/${resolvedParams.id}`);
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      redirect("/admin/training");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="training">
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <Link href="/admin/training" style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>
            Back to training list
          </Link>
          <h1 style={{ margin: "12px 0 0", fontSize: 30, color: "var(--text-primary)" }}>{detail.training.title}</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Maintain the training schedule participants see and publish downloadable materials for the workspace.
          </p>
        </section>

        <AdminTrainingDetailWorkspace
          detail={detail}
          canManageProgramme={user.role === "super_admin" || user.role === "admin"}
        />
      </div>
    </DashboardLayout>
  );
}
