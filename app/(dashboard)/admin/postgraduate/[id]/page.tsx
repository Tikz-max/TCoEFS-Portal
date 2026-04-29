import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { AdminPostgraduateDetailWorkspace } from "@/components/admin/postgraduate/AdminPostgraduateDetailWorkspace";
import {
  getAdminPostgraduateProgramme,
  getPostgraduateAdminLayoutUser,
} from "@/features/postgraduate/catalogue";

export default async function AdminPostgraduateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;

  let user;
  let detail;
  try {
    [user, detail] = await Promise.all([
      getPostgraduateAdminLayoutUser(),
      getAdminPostgraduateProgramme(resolved.id),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect(`/login?redirect=/admin/postgraduate/${resolved.id}`);
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      redirect("/admin/postgraduate");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="postgraduate">
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <Link href="/admin/postgraduate" style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>
            Back to postgraduate list
          </Link>
          <h1 style={{ margin: "12px 0 0", fontSize: 30, color: "var(--text-primary)" }}>{detail.programme.title}</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Update the programme prospectus, requirements, and public admissions details.
          </p>
        </section>

        <AdminPostgraduateDetailWorkspace detail={detail} />
      </div>
    </DashboardLayout>
  );
}
