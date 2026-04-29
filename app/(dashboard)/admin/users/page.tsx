import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import {
  getAdminPortalLayoutUser,
  getPendingCoordinators,
} from "@/features/admin";
import { CoordinatorVerificationClient } from "./CoordinatorVerificationClient";

export default async function AdminUsersPage() {
  let user;
  let coordinators;
  try {
    [user, coordinators] = await Promise.all([
      getAdminPortalLayoutUser(),
      getPendingCoordinators(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/admin/users");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/dashboard");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="users">
      <CoordinatorVerificationClient initialCoordinators={coordinators} />
    </DashboardLayout>
  );
}
