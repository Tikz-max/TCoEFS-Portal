import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, FileText, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout/DashboardLayout";
import { TrainingWorkspaceDetailPanel } from "@/components/training/TrainingWorkspaceDetailPanel";
import { getTrainingWorkspaceSnapshot, type TrainingMaterialItem } from "@/features/training/workspace";

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function groupSessionMaterials(materials: TrainingMaterialItem[]) {
  const groups = new Map<string, TrainingMaterialItem[]>();
  for (const item of materials) {
    if (item.phase !== "session") continue;
    const key = item.sessionLabel || "General Session";
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  return Array.from(groups.entries());
}

export default async function TrainingMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ registration?: string; type?: string }>;
}) {
  const resolvedSearch = await searchParams;

  let workspace;
  try {
    workspace = await getTrainingWorkspaceSnapshot({
      registrationId: resolvedSearch.registration || null,
      materialType: resolvedSearch.type || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      redirect("/login?redirect=/training/materials");
    }
    throw error;
  }

  const current = workspace.current;
  const currentRegistration = current ? `registration=${encodeURIComponent(current.applicationId)}` : "";
  const typeFilters = ["All", ...Object.keys(workspace.filterCounts).sort()];
  const preTraining = workspace.materials.filter((item) => item.phase === "pre_training");
  const postTraining = workspace.materials.filter((item) => item.phase === "post_training");
  const sessionGroups = groupSessionMaterials(workspace.materials);

  return (
    <DashboardLayout
      user={workspace.user}
      activeItem="materials"
      showNavbar={false}
      mobileSidebarMode="drawer"
      mobileMenuLabel="Training Workspace"
      detailPanel={
        <TrainingWorkspaceDetailPanel
          registrations={workspace.registrations}
          currentRegistrationId={current?.applicationId || null}
          activeView="materials"
        />
      }
    >
      <div className="training-materials-shell" style={{ display: "grid", gap: 18, padding: "24px 24px 40px", gridTemplateColumns: "minmax(0, 1fr) 260px" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Training materials</div>
                <h1 style={{ margin: "8px 0 0", fontSize: 30, lineHeight: 1.15, color: "var(--text-primary)" }}>
                  {current ? current.title : "No training selected"}
                </h1>
                <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", maxWidth: 760, lineHeight: 1.7 }}>
                  Materials shown here are published by the training coordinator for the selected training workspace.
                </p>
              </div>
              {current ? (
                <Link
                  href={`/api/training/materials/download-all?${currentRegistration}`}
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Download size={16} /> Download All
                </Link>
              ) : null}
            </div>
          </section>

          {!current ? (
            <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20, color: "var(--text-secondary)" }}>
              Select a training from the workspace rail to view materials.
            </div>
          ) : workspace.materials.length === 0 ? (
            <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20, color: "var(--text-secondary)" }}>
              No materials have been published for this training yet.
            </div>
          ) : (
            <>
              {preTraining.length > 0 ? (
                <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Pre-Training Materials</div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {preTraining.map((material) => (
                      <article key={material.id} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{material.title}</div>
                          {material.description ? <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{material.description}</div> : null}
                          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>{material.materialType} · {formatSize(material.fileSizeBytes)}</div>
                        </div>
                        <Link href={`/api/training/materials/${material.id}/download?${currentRegistration}`} style={{ textDecoration: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Download size={14} /> Download
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {sessionGroups.length > 0 ? (
                <section style={{ display: "grid", gap: 16 }}>
                  {sessionGroups.map(([sessionLabel, materials]) => (
                    <section key={sessionLabel} style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{sessionLabel}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{materials.length} material{materials.length === 1 ? "" : "s"}</div>
                      </div>
                      <div className="training-material-card-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                        {materials.map((material) => (
                          <article key={material.id} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14, display: "grid", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <FileText size={16} color="var(--green-primary)" />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{material.title}</div>
                                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>{material.materialType} · {formatSize(material.fileSizeBytes)}</div>
                              </div>
                            </div>
                            <Link href={`/api/training/materials/${material.id}/download?${currentRegistration}`} style={{ justifySelf: "flex-start", textDecoration: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "9px 12px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                              <Download size={14} /> Download
                            </Link>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </section>
              ) : null}

              {postTraining.length > 0 ? (
                <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Post-Training Materials</div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {postTraining.map((material) => (
                      <article key={material.id} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{material.title}</div>
                          {material.description ? <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{material.description}</div> : null}
                          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>{material.materialType} · {formatSize(material.fileSizeBytes)}</div>
                        </div>
                        <Link href={`/api/training/materials/${material.id}/download?${currentRegistration}`} style={{ textDecoration: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Download size={14} /> Download
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>

        <aside style={{ display: "grid", gap: 16, alignSelf: "start", position: "sticky", top: 88 }}>
          <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              <Filter size={16} /> Filter by type
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {typeFilters.map((type) => {
                const href = current
                  ? `/training/materials?registration=${encodeURIComponent(current.applicationId)}${type === "All" ? "" : `&type=${encodeURIComponent(type)}`}`
                  : "/training/materials";
                const active = (resolvedSearch.type || "All") === type || (!resolvedSearch.type && type === "All");
                const count = type === "All" ? Object.values(workspace.filterCounts).reduce((sum, value) => sum + value, 0) : workspace.filterCounts[type] || 0;
                return (
                  <Link key={type} href={href} style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderRadius: 12, padding: "10px 12px", background: active ? "var(--green-primary)" : "var(--bg-surface-light)", color: active ? "#fff" : "var(--text-secondary)", boxShadow: active ? "var(--elevation-1)" : "var(--shadow-inset)", fontSize: 13, fontWeight: active ? 700 : 600 }}>
                    <span>{type === "All" ? "All Materials" : type}</span>
                    <span style={{ opacity: 0.85 }}>{count}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        @media (max-width: 1120px) {
          .training-materials-shell {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 900px) {
          .training-material-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .training-material-card-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
