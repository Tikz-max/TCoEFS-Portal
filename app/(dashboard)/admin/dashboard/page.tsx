import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import {
  getAdminPortalLayoutUser,
  getAdminWorkspaceCards,
} from "@/features/admin";

export default async function AdminDashboardPage() {
  let user;
  let cards;
  try {
    [user, cards] = await Promise.all([
      getAdminPortalLayoutUser(),
      getAdminWorkspaceCards(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/admin/dashboard");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/login");
    }
    throw error;
  }

  return (
    <DashboardLayout user={user} activeItem="dashboard">
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Admin workspace
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>
            Dashboard overview
          </h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Key metrics and quick access to manage pending approvals, applications, and portal content.
          </p>
        </section>

        <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {cards.map((card) => (
            <Link
              key={`${card.title}-${card.href}`}
              href={card.href}
              style={{
                textDecoration: "none",
                background: "var(--bg-surface-default)",
                boxShadow: "var(--elevation-2)",
                borderRadius: 20,
                padding: 20,
                display: "grid",
                gap: 12,
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{card.title}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-primary)", whiteSpace: "nowrap" }}>{card.stat}</div>
              </div>
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: 14 }}>{card.description}</div>
              <div style={{ color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>Open workspace</div>
            </Link>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
