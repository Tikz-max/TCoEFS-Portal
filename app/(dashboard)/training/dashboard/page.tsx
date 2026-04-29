import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, CalendarRange, Clock3, CreditCard, FileText, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { TrainingWorkspaceDetailPanel } from "@/components/training/TrainingWorkspaceDetailPanel";
import {
  getTrainingDashboardPortalData,
  type ParticipantRegistrationSummary,
} from "@/features/training/workspace";
import {
  buildTrainingStepHref,
  buildTrainingWorkspaceHref,
} from "@/features/training/routes";

function stateCopy(registration: ParticipantRegistrationSummary | null) {
  if (!registration) {
    return {
      title: "Begin your training registration",
      body: "Register for a new training programme and the portal will keep it in your workspace even after completion.",
      cta: buildTrainingStepHref(1, null),
      ctaLabel: "Start registration",
    };
  }

  if (registration.portalState === "registration_incomplete") {
    return {
      title: "Finish your training registration",
      body: "Complete the remaining steps so this training moves into payment and approval.",
      cta: buildTrainingStepHref(1, registration.applicationId),
      ctaLabel: "Continue registration",
    };
  }
  if (registration.portalState === "awaiting_payment") {
    return {
      title: "Payment required",
      body: "Your registration is saved. Submit payment and upload your receipt to unlock the training workspace.",
      cta: buildTrainingStepHref(4, registration.applicationId),
      ctaLabel: "Open payment step",
    };
  }
  if (registration.portalState === "payment_under_review") {
    return {
      title: "Payment under review",
      body: "Your receipt has been uploaded and is waiting for admin confirmation.",
      cta: buildTrainingStepHref(5, registration.applicationId),
      ctaLabel: "Track review status",
    };
  }
  if (registration.portalState === "payment_rejected") {
    return {
      title: "Payment needs correction",
      body: "Your receipt was rejected. Return to the payment step and upload a corrected receipt.",
      cta: buildTrainingStepHref(4, registration.applicationId),
      ctaLabel: "Re-upload receipt",
    };
  }
  if (registration.portalState === "registration_rejected") {
    return {
      title: "Registration rejected",
      body: registration.adminNotes || "Your training registration was not approved by admissions.",
      cta: null as string | null,
      ctaLabel: null as string | null,
    };
  }
  if (registration.portalState === "in_progress") {
    return {
      title: "Training in progress",
      body: "Your current training is active. Use the schedule and materials sections to stay on track.",
      cta: buildTrainingWorkspaceHref("/training/schedule", registration.applicationId),
      ctaLabel: "Open schedule",
    };
  }
  if (registration.portalState === "completed" || registration.portalState === "completed_with_certificate") {
    return {
      title: "Training completed",
      body: "This training remains in your workspace for future reference, materials access, and certificate retrieval.",
      cta:
        registration.portalState === "completed_with_certificate"
          ? buildTrainingWorkspaceHref("/training/certificate", registration.applicationId)
          : buildTrainingWorkspaceHref("/training/materials", registration.applicationId),
      ctaLabel:
        registration.portalState === "completed_with_certificate"
          ? "Open certificate"
          : "Open materials",
    };
  }

  return {
    title: "Training confirmed",
    body: "Your training registration is approved. Continue into the workspace to follow sessions and resources.",
    cta: buildTrainingWorkspaceHref("/training/schedule", registration.applicationId),
    ctaLabel: "Open workspace",
  };
}

function stateBadge(registration: ParticipantRegistrationSummary) {
  if (registration.portalState === "registration_rejected") {
    return { fg: "var(--status-error-text)", bg: "var(--status-error-bg)", label: "Registration Rejected" };
  }
  if (registration.portalState === "payment_rejected") {
    return { fg: "var(--status-error-text)", bg: "var(--status-error-bg)", label: "Payment Rejected" };
  }
  if (registration.portalState === "awaiting_payment" || registration.portalState === "payment_under_review") {
    return { fg: "var(--status-warning-text)", bg: "var(--status-warning-bg)", label: "Action Pending" };
  }
  if (registration.portalState === "completed" || registration.portalState === "completed_with_certificate") {
    return { fg: "var(--green-dark)", bg: "var(--green-whisper)", label: "Completed" };
  }
  return { fg: "var(--green-primary)", bg: "var(--green-whisper)", label: "Current" };
}

function currency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function TrainingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ registration?: string }>;
}) {
  const resolvedSearch = await searchParams;

  let data;
  try {
    data = await getTrainingDashboardPortalData({ registrationId: resolvedSearch.registration || null });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/training/dashboard");
    }
    throw error;
  }

  const current = data.workspace.current;
  const hero = stateCopy(current);
  const activeRegistrations = data.workspace.registrations.filter(
    (item) => item.portalState !== "completed" && item.portalState !== "completed_with_certificate"
  );
  const completedRegistrations = data.workspace.registrations.filter(
    (item) => item.portalState === "completed" || item.portalState === "completed_with_certificate"
  );

  return (
    <DashboardLayout
      user={data.user}
      activeItem="overview"
      showNavbar={false}
      mobileSidebarMode="drawer"
      mobileMenuLabel="Training Workspace"
      detailPanel={
        <TrainingWorkspaceDetailPanel
          registrations={data.workspace.registrations}
          currentRegistrationId={current?.applicationId || null}
          activeView="dashboard"
        />
      }
    >
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section
          style={{
            background: "var(--bg-surface-default)",
            boxShadow: "var(--elevation-2)",
            borderRadius: 20,
            padding: 22,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Hello {data.user.name}
              </div>
              <h1 style={{ margin: "8px 0 0", fontSize: 32, lineHeight: 1.15, color: "var(--text-primary)" }}>
                {hero.title}
              </h1>
              <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", maxWidth: 760, lineHeight: 1.7 }}>
                {hero.body}
              </p>
            </div>
            {hero.cta ? (
            <Link
              href={hero.cta}
              style={{
                alignSelf: "flex-start",
                textDecoration: "none",
                background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                color: "#fff",
                borderRadius: 999,
                boxShadow: "var(--elevation-1)",
                padding: "11px 18px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {hero.ctaLabel}
            </Link>
            ) : null}
          </div>

          {current ? (
            <div className="training-dashboard-grid" style={{ marginTop: 18, display: "grid", gap: 12, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
              <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Current training</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: "var(--text-primary)" }}>{current.title}</div>
              </div>
              <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Programme fee</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: "var(--text-primary)" }}>{currency(current.fee)}</div>
              </div>
              <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Venue</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: "var(--text-primary)" }}>{current.venue || "To be announced"}</div>
              </div>
              <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Portal state</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: stateBadge(current).fg }}>{stateBadge(current).label}</div>
              </div>
            </div>
          ) : null}
        </section>

        <section style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.7fr)" }} className="training-overview-stack">
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Current and upcoming trainings</div>
              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                {activeRegistrations.length === 0 ? (
                  <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    No active or upcoming training in your workspace right now.
                  </div>
                ) : (
                  activeRegistrations.map((registration) => {
                    const badge = stateBadge(registration);
                    return (
                      <div key={registration.applicationId} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 16, padding: 16, display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{registration.title}</div>
                            <div style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap", color: "var(--text-secondary)", fontSize: 13 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CalendarRange size={14} />{registration.scheduleSummary || "Schedule pending"}</span>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={14} />{registration.venue || "Venue pending"}</span>
                            </div>
                          </div>
                          <div style={{ alignSelf: "flex-start", borderRadius: 999, padding: "7px 10px", fontSize: 11, fontWeight: 700, color: badge.fg, background: badge.bg }}>
                            {badge.label}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Completed trainings</div>
              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                {completedRegistrations.length === 0 ? (
                  <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    Completed trainings will remain here with access to materials and certificates.
                  </div>
                ) : (
                  completedRegistrations.map((registration) => (
                    <div key={registration.applicationId} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 16, padding: 16, display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{registration.title}</div>
                          <div style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap", color: "var(--text-secondary)", fontSize: 13 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock3 size={14} />Archived workspace retained</span>
                            {registration.certificateNumber ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Award size={14} />{registration.certificateNumber}</span> : null}
                          </div>
                        </div>
                        <div style={{ borderRadius: 999, padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "var(--green-dark)", background: "var(--green-whisper)" }}>Completed</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Link href={`/training/materials?registration=${encodeURIComponent(registration.applicationId)}`} style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>Materials</Link>
                        <Link href={`/training/schedule?registration=${encodeURIComponent(registration.applicationId)}`} style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>Schedule</Link>
                        <Link href={`/training/certificate?registration=${encodeURIComponent(registration.applicationId)}`} style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>Certificate</Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Workspace shortcuts</div>
              {current ? (
                <>
                  <Link href={`/training/schedule?registration=${encodeURIComponent(current.applicationId)}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}><CalendarRange size={16} />Schedule</Link>
                  <Link href={`/training/materials?registration=${encodeURIComponent(current.applicationId)}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}><FileText size={16} />Materials</Link>
                  <Link href={`/training/payment?registration=${encodeURIComponent(current.applicationId)}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}><CreditCard size={16} />Payment</Link>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .training-overview-stack {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 900px) {
          .training-dashboard-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .training-dashboard-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
