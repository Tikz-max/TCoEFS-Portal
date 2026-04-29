import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { getAdminPortalLayoutUser } from "@/features/admin";

export default async function AdminApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await getAdminPortalLayoutUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/admin/applications");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    throw error;
  }

  return <DashboardLayout user={user} activeItem="applications">{children}</DashboardLayout>;
}