import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, CreditCard, FileWarning } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { TrainingWorkspaceDetailPanel } from "@/components/training/TrainingWorkspaceDetailPanel";
import { buildTrainingStepHref, buildTrainingWorkspaceHref } from "@/features/training/routes";
import { getTrainingWorkspaceSnapshot } from "@/features/training/workspace";

function currency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function paymentTone(status: "pending_approval" | "successful" | "failed") {
  if (status === "successful") {
    return {
      label: "Approved",
      fg: "var(--status-success-text)",
      bg: "var(--status-success-bg)",
      icon: <CheckCircle2 size={16} />,
    };
  }
  if (status === "failed") {
    return {
      label: "Declined",
      fg: "var(--status-error-text)",
      bg: "var(--status-error-bg)",
      icon: <FileWarning size={16} />,
    };
  }
  return {
    label: "Under Review",
    fg: "var(--status-warning-text)",
    bg: "var(--status-warning-bg)",
    icon: <Clock3 size={16} />,
  };
}

export default async function TrainingPaymentPage({
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
      redirect("/login?redirect=/training/payment");
    }
    throw error;
  }

  const paymentHistory = workspace.registrations.filter(
    (item) =>
      item.paymentStatus === "pending_approval" ||
      item.paymentStatus === "successful" ||
      item.paymentStatus === "failed"
  );

  return (
    <DashboardLayout
      user={workspace.user}
      activeItem="payment"
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
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Payment history</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>Approved, declined, and under review payments</h1>
          <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
            Payment uploads happen inside registration. This page is the history view for submitted training payments.
          </p>
        </section>

        {paymentHistory.length === 0 ? (
          <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, color: "var(--text-secondary)" }}>
            No payment submissions have been recorded yet.
          </section>
        ) : (
          <section style={{ display: "grid", gap: 14 }}>
            {paymentHistory.map((item) => {
              const tone = paymentTone(
                item.paymentStatus as "pending_approval" | "successful" | "failed"
              );
              const actionHref =
                item.paymentStatus === "failed"
                  ? buildTrainingStepHref(4, item.applicationId)
                  : item.paymentStatus === "pending_approval"
                    ? buildTrainingStepHref(5, item.applicationId)
                    : buildTrainingWorkspaceHref("/training/dashboard", item.applicationId);
              const actionLabel =
                item.paymentStatus === "failed"
                  ? "Re-open payment step"
                  : item.paymentStatus === "pending_approval"
                    ? "Track review"
                    : "Open workspace";

              return (
                <article key={item.applicationId} style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 18, display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>{currency(item.fee)}</div>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 12px", color: tone.fg, background: tone.bg, fontSize: 12, fontWeight: 700 }}>
                      {tone.icon}
                      {tone.label}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
                    <div>Training status: {item.trainingStatus.replaceAll("_", " ")}</div>
                    <div>Receipt upload: {item.receiptUploadedAt ? new Date(item.receiptUploadedAt).toLocaleString("en-NG") : "Not recorded"}</div>
                    {item.adminNotes ? <div style={{ color: item.paymentStatus === "failed" ? "var(--status-error-text)" : "var(--text-secondary)" }}>Admin note: {item.adminNotes}</div> : null}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={actionHref} style={{ textDecoration: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>
                      {actionLabel}
                    </Link>
                    <Link href={buildTrainingWorkspaceHref("/training/materials", item.applicationId)} style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700, alignSelf: "center" }}>
                      Materials
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
