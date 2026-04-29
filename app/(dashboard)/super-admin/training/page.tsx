"use client";

import React, { useState } from "react";
import {
  Search,
  Eye,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  BookOpen,
  Send,
  ArrowLeft,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { ConfirmationModal } from "@/components/ui/modals/ConfirmationModal";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/super-admin/training
   - Purpose: Fetch all training programmes with full visibility
   - Query params: status, coordinator, search, page, limit
   - Response: { trainings: Training[], total: number, page: number, pages: number }
   - Auth: Super Admin only
   
   GET /api/super-admin/training/:id
   - Purpose: Fetch single training with full details
   - Response: { training: TrainingDetail }
   - Auth: Super Admin only
   
   POST /api/super-admin/training/:id/approve
   - Purpose: Approve and publish training
   - Response: { success: boolean, training: Training }
   - Side effects: Triggers notification to coordinator
   - Auth: Super Admin only
   
   POST /api/super-admin/training/:id/reject
   - Purpose: Reject training publish request
   - Body: { reason: string }
   - Response: { success: boolean, training: Training }
   - Auth: Super Admin only
   
   PATCH /api/super-admin/training/:id
   - Purpose: Edit any training programme
   - Body: Training fields
   - Response: { success: boolean, training: Training }
   - Auth: Super Admin only
   ============================================================================ */

const C = {
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
  successBg: "#DCFCE7",
  successText: "#166534",
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
};

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
};

interface Training {
  id: string;
  title: string;
  coordinator: string;
  coordinatorEmail: string;
  category: string;
  mode: "in-person" | "virtual" | "hybrid";
  slots: number;
  registered: number;
  startDate: string;
  endDate: string;
  status: "draft" | "pending_publish" | "published" | "completed" | "cancelled";
  description: string;
  createdAt: string;
  requestedPublishAt?: string;
}

const mockTrainings: Training[] = [
  { id: "TRG-2026-0015", title: "Organic Farming Certification Prep", coordinator: "Prof. Chukwuma Obi", coordinatorEmail: "c.obi@tcoefs.org", category: "Agriculture", mode: "in-person", slots: 50, registered: 0, startDate: "15 Apr 2026", endDate: "20 Apr 2026", status: "pending_publish", description: "Comprehensive certification preparation for organic farming practices.", createdAt: "22 Mar 2026", requestedPublishAt: "23 Mar 2026" },
  { id: "TRG-2026-0014", title: "Farm Business Planning", coordinator: "Dr. Fatima Mohammed", coordinatorEmail: "f.mohammed@tcoefs.org", category: "Business", mode: "hybrid", slots: 30, registered: 30, startDate: "01 May 2026", endDate: "10 May 2026", status: "published", description: "Learn to create effective business plans for agricultural ventures.", createdAt: "20 Mar 2026" },
  { id: "TRG-2026-0013", title: "Climate-Smart Agriculture Workshop", coordinator: "Prof. Chukwuma Obi", coordinatorEmail: "c.obi@tcoefs.org", category: "Agriculture", mode: "virtual", slots: 100, registered: 87, startDate: "05 Apr 2026", endDate: "07 Apr 2026", status: "published", description: "Workshop on adapting farming practices for climate resilience.", createdAt: "18 Mar 2026" },
  { id: "TRG-2026-0012", title: "Post-Harvest Management", coordinator: "Mrs. Grace Adeyemi", coordinatorEmail: "g.adeyemi@tcoefs.org", category: "Food Technology", mode: "in-person", slots: 25, registered: 25, startDate: "01 Mar 2026", endDate: "15 Mar 2026", status: "completed", description: "Techniques for reducing post-harvest losses and maintaining quality.", createdAt: "15 Feb 2026" },
  { id: "TRG-2026-0011", title: "Sustainable Livestock Systems", coordinator: "Dr. Emeka Nwosu", coordinatorEmail: "e.nwosu@tcoefs.org", category: "Agriculture", mode: "hybrid", slots: 40, registered: 0, startDate: "20 Apr 2026", endDate: "25 Apr 2026", status: "draft", description: "Sustainable practices for livestock management.", createdAt: "10 Mar 2026" },
];

const getStatusBadge = (status: Training["status"]) => {
  const styles: Record<Training["status"], { bg: string; color: string; label: string }> = {
    draft: { bg: C.canvas, color: C.textMuted, label: "Draft" },
    pending_publish: { bg: C.warningBg, color: C.warningText, label: "Pending Review" },
    published: { bg: C.successBg, color: C.successText, label: "Published" },
    completed: { bg: C.infoBg, color: C.infoText, label: "Completed" },
    cancelled: { bg: C.dangerBg, color: C.dangerText, label: "Cancelled" },
  };
  const s = styles[status];
  return <span style={{ padding: "4px 10px", borderRadius: 6, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
};

const getModeBadge = (mode: Training["mode"]) => {
  const icons: Record<Training["mode"], typeof Users> = { "in-person": Users, virtual: BookOpen, hybrid: GraduationCap };
  const Icon = icons[mode];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textSec }}><Icon size={12} />{mode}</span>;
};

const thStyle: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted };

export default function SuperAdminTrainingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filteredTrainings = mockTrainings.filter((t) => {
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingTrainings = mockTrainings.filter((t) => t.status === "pending_publish");
  const publishedCount = mockTrainings.filter((t) => t.status === "published" || t.status === "completed").length;
  const totalRegistrations = mockTrainings.filter((t) => t.status === "published" || t.status === "completed").reduce((sum, t) => sum + t.registered, 0);

  const openViewModal = (training: Training) => {
    setSelectedTraining(training);
    setViewModalOpen(true);
  };

  const handleApprove = () => {
    console.log("Approved:", selectedTraining?.id);
    setApproveModalOpen(false);
    setViewModalOpen(false);
    setSelectedTraining(null);
  };

  const handleReject = () => {
    console.log("Rejected:", selectedTraining?.id, "Reason:", rejectReason);
    setRejectModalOpen(false);
    setViewModalOpen(false);
    setSelectedTraining(null);
    setRejectReason("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.canvas }}>
      <Sidebar user={{ name: "Super Admin", initials: "SA", role: "super_admin", roleLabel: "Super Admin" }} activeItem="training" badges={{}} />

      <main style={{ flex: 1, padding: "32px 40px" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.6px", marginBottom: 4 }}>Training</h1>
            <p style={{ fontSize: 14, color: C.textSec }}>Review and manage training programmes</p>
          </div>
        </div>

        {pendingTrainings.length > 0 && (
          <div style={{ padding: "20px 24px", background: C.warningBg, border: `1px solid ${C.warningText}30`, borderRadius: 8, display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.warningText + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={24} color={C.warningText} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.warningText }}>{pendingTrainings.length} training programme{pendingTrainings.length > 1 ? "s" : ""} awaiting your review</div>
              <div style={{ fontSize: 13, color: C.warningText, marginTop: 2 }}>Click on a pending training to review details and approve or reject</div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.canvas, display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={20} color={C.textMuted} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{mockTrainings.length}</div><div style={{ fontSize: 12, color: C.textMuted }}>Total Programmes</div></div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.successText + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle size={20} color={C.successText} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{publishedCount}</div><div style={{ fontSize: 12, color: C.textMuted }}>Published</div></div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.warningText + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><Clock size={20} color={C.warningText} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{pendingTrainings.length}</div><div style={{ fontSize: 12, color: C.textMuted }}>Pending Review</div></div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.infoText + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={20} color={C.infoText} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{totalRegistrations}</div><div style={{ fontSize: 12, color: C.textMuted }}>Total Registrations</div></div>
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}` }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
              <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title or ID..." style={{ height: 36, paddingLeft: 36, paddingRight: 12, border: `1px solid ${C.border}`, borderRadius: 6, background: C.canvas, fontSize: 13, color: C.text, outline: "none", width: "100%" }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 36, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.white, fontSize: 13, color: C.text, outline: "none", cursor: "pointer" }}>
              <option value="all">All Status</option>
              <option value="pending_publish">Pending Review</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: C.canvas }}>
                <th style={thStyle}>Training</th>
                <th style={thStyle}>Coordinator</th>
                <th style={thStyle}>Mode</th>
                <th style={thStyle}>Slots</th>
                <th style={thStyle}>Dates</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
              </tr></thead>
              <tbody>{filteredTrainings.map((training) => (
                <tr key={training.id} style={{ borderTop: `1px solid ${C.borderSubtle}`, background: training.status === "pending_publish" ? C.warningBg + "30" : "transparent", transition: "background 100ms ease", cursor: "pointer" }} onClick={() => openViewModal(training)} onMouseEnter={(e) => { if (training.status !== "pending_publish") e.currentTarget.style.background = C.canvas; }} onMouseLeave={(e) => { e.currentTarget.style.background = training.status === "pending_publish" ? C.warningBg + "30" : "transparent"; }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{training.id}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{training.title}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 13, color: C.text }}>{training.coordinator}</div></td>
                  <td style={{ padding: "12px 16px" }}>{getModeBadge(training.mode)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {(training.status === "published" || training.status === "completed") ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 6, borderRadius: 3, background: C.canvas, overflow: "hidden" }}>
                          <div style={{ width: `${(training.registered / training.slots) * 100}%`, height: "100%", background: training.registered === training.slots ? C.warningText : C.successText, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: C.textSec }}>{training.registered}/{training.slots}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: C.textMuted }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 12, color: C.text }}>{training.startDate}</div><div style={{ fontSize: 11, color: C.textMuted }}>{training.endDate}</div></td>
                  <td style={{ padding: "12px 16px" }}>{getStatusBadge(training.status)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <button style={{ height: 32, padding: "0 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}>
                      <Eye size={14} />Review
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </main>

      {/* View/Review Modal */}
      {selectedTraining && (
        <>
          <div onClick={() => setViewModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, maxHeight: "90vh", background: C.white, borderRadius: 12, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.canvas }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>{selectedTraining.id}</span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "4px 0 0" }}>{selectedTraining.title}</h2>
              </div>
              {getStatusBadge(selectedTraining.status)}
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Coordinator</div>
                <div style={{ fontSize: 14, color: C.text }}>{selectedTraining.coordinator}</div>
                <div style={{ fontSize: 12, color: C.textSec }}>{selectedTraining.coordinatorEmail}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{selectedTraining.description}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Mode</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{getModeBadge(selectedTraining.mode)}</div>
                </div>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Category</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selectedTraining.category}</div>
                </div>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Slots</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selectedTraining.slots} available</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Start Date</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} />{selectedTraining.startDate}</div>
                </div>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>End Date</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} />{selectedTraining.endDate}</div>
                </div>
              </div>

              <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Created</div>
                <div style={{ fontSize: 14, color: C.text }}>{selectedTraining.createdAt}</div>
                {selectedTraining.requestedPublishAt && <div style={{ fontSize: 12, color: C.warningText, marginTop: 4 }}>Publish requested: {selectedTraining.requestedPublishAt}</div>}
              </div>

              {selectedTraining.status === "pending_publish" && (
                <div style={{ marginTop: 20, padding: 16, background: C.warningBg, borderRadius: 8, border: `1px solid ${C.warningText}30` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Clock size={18} color={C.warningText} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.warningText }}>Awaiting Your Review</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.warningText, margin: 0 }}>Review the details above and approve to publish or reject with feedback.</p>
                </div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.borderSubtle}`, display: "flex", gap: 12 }}>
              <button onClick={() => setViewModalOpen(false)} style={{ flex: 1, height: 44, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.textSec, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
              {selectedTraining.status === "pending_publish" && (
                <>
                  <button onClick={() => { setViewModalOpen(false); setRejectModalOpen(true); }} style={{ flex: 1, height: 44, borderRadius: 8, border: "none", background: C.dangerBg, color: C.dangerText, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <XCircle size={16} />Reject
                  </button>
                  <button onClick={() => { setViewModalOpen(false); setApproveModalOpen(true); }} style={{ flex: 1, height: 44, borderRadius: 8, border: "none", background: C.successText, color: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <CheckCircle size={16} />Approve & Publish
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmationModal open={approveModalOpen} title="Approve & Publish Training" message={`Approve "${selectedTraining?.title}"? It will be published immediately and subscribers will be notified.`} iconType="success" confirmLabel="Yes, Approve & Publish" onConfirm={handleApprove} onCancel={() => setApproveModalOpen(false)} />
      
      <ConfirmationModal open={rejectModalOpen} title="Reject Training" message={
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16 }}>Provide feedback for the coordinator on why this is being rejected.</p>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Missing required documents, content needs revision..." rows={4} style={{ width: "100%", padding: "12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
        </div>
      } iconType="danger" confirmLabel="Reject Training" destructive onConfirm={handleReject} onCancel={() => { setRejectModalOpen(false); setRejectReason(""); }} />
    </div>
  );
}
