import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { AdminElearningCourseManager } from "@/components/admin/elearning/AdminElearningCourseManager";
import {
  getAdminElearningCourses,
  getElearningAdminLayoutUser,
} from "@/features/elearning";

export default async function AdminElearningPage() {
  let user;
  let courses;
  try {
    [user, courses] = await Promise.all([
      getElearningAdminLayoutUser(),
      getAdminElearningCourses(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/admin/elearning");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="elearning">
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            E-learning workspace
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>E-learning courses</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Use this live workspace to create, edit, and delete e-learning courses without dropping back into the old mock admin screens.
          </p>
        </section>

        <AdminElearningCourseManager courses={courses} />
      </div>
    </DashboardLayout>
  );
}
