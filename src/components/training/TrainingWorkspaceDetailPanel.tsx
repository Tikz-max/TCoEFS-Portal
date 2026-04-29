
import type { ParticipantRegistrationSummary } from "@/features/training/workspace";

function portalStateLabel(state: ParticipantRegistrationSummary["portalState"]) {
  if (state === "registration_incomplete") return "Registration Incomplete";
  if (state === "awaiting_payment") return "Awaiting Payment";
  if (state === "payment_under_review") return "Payment Under Review";
  if (state === "payment_rejected") return "Payment Rejected";
  if (state === "registration_rejected") return "Registration Rejected";
  if (state === "upcoming") return "Upcoming";
  if (state === "in_progress") return "In Progress";
  if (state === "completed") return "Completed";
  return "Completed + Certificate";
}

function portalStateTone(state: ParticipantRegistrationSummary["portalState"]) {
  if (state === "payment_rejected" || state === "registration_rejected") {
    return { color: "var(--status-error-text)", bg: "var(--status-error-bg)" };
  }
  if (state === "payment_under_review" || state === "awaiting_payment") {
    return { color: "var(--status-warning-text)", bg: "var(--status-warning-bg)" };
  }
  if (state === "completed" || state === "completed_with_certificate") {
    return { color: "var(--green-dark)", bg: "var(--green-whisper)" };
  }
  return { color: "var(--green-primary)", bg: "var(--green-whisper)" };
}

export function TrainingWorkspaceDetailPanel({
  registrations,
  currentRegistrationId,
  activeView,
}: {
  registrations: ParticipantRegistrationSummary[];
  currentRegistrationId: string | null;
  activeView: "dashboard" | "schedule" | "materials";
}) {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <section
        style={{
          background: "var(--bg-surface-default)",
          boxShadow: "var(--elevation-2)",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Training Workspace
        </div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {registrations.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              No training registrations yet. Start a new registration from your dashboard.
            </div>
          ) : (
            registrations.map((registration) => {
              const tone = portalStateTone(registration.portalState);
              const isCurrent = registration.applicationId === currentRegistrationId;
              const hrefBase = `?registration=${encodeURIComponent(registration.applicationId)}`;
              return (
                <div
                  key={registration.applicationId}
                  style={{
                    borderRadius: 14,
                    background: isCurrent ? "var(--green-whisper)" : "var(--bg-surface-light)",
                    boxShadow: "var(--elevation-1)",
                    padding: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{registration.title}</div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      width: "fit-content",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: tone.color,
                      background: tone.bg,
                    }}
                  >
                    {portalStateLabel(registration.portalState)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
