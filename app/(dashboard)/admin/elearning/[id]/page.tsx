import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { AdminElearningCourseEditor } from "@/components/admin/elearning/AdminElearningCourseEditor";
import {
  getAdminElearningCourse,
  getElearningAdminLayoutUser,
} from "@/features/elearning";

export default async function AdminElearningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;

  let user;
  let detail;
  try {
    [user, detail] = await Promise.all([
      getElearningAdminLayoutUser(),
      getAdminElearningCourse(resolved.id),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect(`/login?redirect=/admin/elearning/${resolved.id}`);
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    if (error instanceof Error && error.message === "Course not found.") {
      redirect("/admin/elearning");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="elearning">
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <AdminElearningCourseEditor detail={detail} />
      </div>
    </DashboardLayout>
  );
}
