import Link from "next/link";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { TrainingWorkspaceDetailPanel } from "@/components/training/TrainingWorkspaceDetailPanel";
import { buildTrainingWorkspaceHref } from "@/features/training/routes";
import { getTrainingWorkspaceSnapshot } from "@/features/training/workspace";

export default async function TrainingCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ registration?: string }>;
}) {
  const resolvedSearch = await searchParams;

  let workspace;
  try {
    workspace = await getTrainingWorkspaceSnapshot({ registrationId: resolvedSearch.registration || null });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/training/certificate");
    }
    throw error;
  }

  const completed = workspace.registrations.filter(
    (item) => item.portalState === "completed" || item.portalState === "completed_with_certificate"
  );

  return (
    <DashboardLayout
      user={workspace.user}
      activeItem="certificate"
      showNavbar={false}
      mobileSidebarMode="drawer"
      mobileMenuLabel="Training Workspace"
      detailPanel={
        <TrainingWorkspaceDetailPanel
          registrations={workspace.registrations}
          currentRegistrationId={workspace.current?.applicationId || null}
          activeView="dashboard"
        />
      }
    >
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Certificate history</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>Training completion records</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Completed trainings remain here. When a certificate is issued, the certificate number is attached to that training record.
          </p>
        </section>

        {completed.length === 0 ? (
          <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, color: "var(--text-secondary)" }}>
            No completed training records yet.
          </section>
        ) : (
          <section style={{ display: "grid", gap: 14 }}>
            {completed.map((item) => (
              <article key={item.applicationId} style={{ background: item.certificateNumber ? "linear-gradient(135deg, var(--gold-whisper) 0%, var(--bg-surface-default) 100%)" : "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 18, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                      {item.certificateNumber ? "Certificate issued" : "Awaiting certificate issuance"}
                    </div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 12px", color: item.certificateNumber ? "var(--text-on-gold)" : "var(--text-secondary)", background: item.certificateNumber ? "var(--gold-primary)" : "var(--green-whisper)", fontSize: 12, fontWeight: 700 }}>
                    <Award size={16} />
                    {item.certificateNumber ? "Issued" : "Pending"}
                  </div>
                </div>

                {item.certificateNumber ? (
                  <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Certificate number</div>
                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{item.certificateNumber}</div>
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href={buildTrainingWorkspaceHref("/training/dashboard", item.applicationId)} style={{ textDecoration: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>
                    Open workspace
                  </Link>
                  <Link href={buildTrainingWorkspaceHref("/training/materials", item.applicationId)} style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700, alignSelf: "center" }}>
                    Materials
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
