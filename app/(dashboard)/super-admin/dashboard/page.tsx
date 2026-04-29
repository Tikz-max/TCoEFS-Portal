import { redirect } from "next/navigation";

export default function SuperAdminDashboardRedirectPage() {
  redirect("/admin/dashboard");
}
