import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarRange, Clock3, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { TrainingWorkspaceDetailPanel } from "@/components/training/TrainingWorkspaceDetailPanel";
import { getTrainingWorkspaceSnapshot } from "@/features/training/workspace";

export default async function TrainingSchedulePage({
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
      redirect("/login?redirect=/training/schedule");
    }
    throw error;
  }

  const current = workspace.current;

  return (
    <DashboardLayout
      user={workspace.user}
      activeItem="schedule"
      showNavbar={false}
      mobileSidebarMode="drawer"
      mobileMenuLabel="Training Workspace"
      detailPanel={
        <TrainingWorkspaceDetailPanel
          registrations={workspace.registrations}
          currentRegistrationId={current?.applicationId || null}
          activeView="schedule"
        />
      }
    >
      <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Training schedule</div>
              <h1 style={{ margin: "8px 0 0", fontSize: 30, lineHeight: 1.15, color: "var(--text-primary)" }}>
                {current ? current.title : "No active training selected"}
              </h1>
              <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", maxWidth: 760, lineHeight: 1.7 }}>
                Schedules are managed by the training coordinator. Any edits made by admin will appear here automatically.
              </p>
            </div>
            {current ? (
              <Link
                href={`/training/materials?registration=${encodeURIComponent(current.applicationId)}`}
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
                Open materials
              </Link>
            ) : null}
          </div>

          {current ? (
            <div className="training-schedule-meta" style={{ marginTop: 18, display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Programme status</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>{current.trainingStatus.replaceAll("_", " ")}</div>
              </div>
              <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Venue</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: "var(--text-primary)" }}>{current.venue || "To be announced"}</div>
              </div>
              <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Schedule summary</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: "var(--text-primary)" }}>{current.scheduleSummary || "Awaiting upload"}</div>
              </div>
            </div>
          ) : null}
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {!current ? (
            <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20, color: "var(--text-secondary)" }}>
              Select a training from your workspace to view its schedule.
            </div>
          ) : workspace.schedule.length === 0 ? (
            <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20, color: "var(--text-secondary)" }}>
              The training coordinator has not published the session schedule for this training yet.
            </div>
          ) : (
            workspace.schedule.map((day) => (
              <article key={day.id} style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20, display: "grid", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                      Day {day.dayNumber} · {day.moduleLabel}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{day.topic}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap", color: "var(--text-secondary)", fontSize: 13 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CalendarRange size={14} />{day.date}</span>
                      {day.location ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={14} />{day.location}</span> : null}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {day.sessions.map((session) => (
                    <div key={session.id} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14, display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{session.title}</div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 12, fontWeight: 700 }}><Clock3 size={14} />{session.startTime} - {session.endTime}</div>
                      </div>
                      {session.facilitator ? <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Facilitator: {session.facilitator}</div> : null}
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .training-schedule-meta {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
