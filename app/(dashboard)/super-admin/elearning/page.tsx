"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Users,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Eye,
  BookMarked,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { ConfirmationModal } from "@/components/ui/modals/ConfirmationModal";
import type { Course } from "@/types/elearning.types";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/super-admin/elearning/stats
   - Purpose: Fetch all courses statistics
   - Response: { stats: CourseStats }
   - Auth: Super Admin only
   
   GET /api/super-admin/elearning/courses
   - Purpose: Fetch all courses
   - Query params: status, coordinator_id, search, page, limit
   - Response: { courses: Course[], total: number }
   - Auth: Super Admin only
   
   GET /api/super-admin/elearning/courses/:id
   - Purpose: Fetch single course with full details
   - Response: { course: CourseDetail }
   - Auth: Super Admin only
   
   POST /api/super-admin/elearning/courses/:id/approve
   - Purpose: Approve and publish course
   - Response: { success: boolean, course: Course }
   - Auth: Super Admin only
   
   POST /api/super-admin/elearning/courses/:id/reject
   - Purpose: Reject course publish request
   - Body: { reason: string }
   - Response: { success: boolean }
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
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
  successBg: "#DCFCE7",
  successText: "#166534",
  goldBg: "#FDF3D0",
  goldText: "#92400E",
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
};

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15)",
  elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12)",
};

const mockCourses: (Course & { coordinatorEmail?: string; requestedPublishAt?: string })[] = [
  { id: "CRS-2026-001", title: "Sustainable Food Systems Management", description: "Comprehensive course on sustainable food production and distribution.", category: "Agriculture", status: "published", coordinatorId: "COORD-001", coordinatorName: "Prof. Chukwuma Obi", coordinatorEmail: "c.obi@tcoefs.org", modules: [], passThreshold: 70, enrolledCount: 89, completedCount: 34, createdAt: "2026-01-15", updatedAt: "2026-03-10" },
  { id: "CRS-2026-002", title: "Agricultural Value Chain Analysis", description: "Learn to analyze and optimize agricultural value chains.", category: "Economics", status: "published", coordinatorId: "COORD-001", coordinatorName: "Prof. Chukwuma Obi", coordinatorEmail: "c.obi@tcoefs.org", modules: [], passThreshold: 65, enrolledCount: 67, completedCount: 28, createdAt: "2026-02-01", updatedAt: "2026-03-05" },
  { id: "CRS-2026-003", title: "Post-Harvest Loss Reduction", description: "Techniques for reducing post-harvest losses in agriculture.", category: "Food Technology", status: "pending_publish", coordinatorId: "COORD-002", coordinatorName: "Dr. Fatima Mohammed", coordinatorEmail: "f.mohammed@tcoefs.org", modules: [], passThreshold: 70, enrolledCount: 0, completedCount: 0, createdAt: "2026-03-01", updatedAt: "2026-03-15", requestedPublishAt: "22 Mar 2026" },
  { id: "CRS-2026-004", title: "Climate-Smart Agriculture", description: "Adapting agricultural practices for climate resilience.", category: "Agriculture", status: "pending_publish", coordinatorId: "COORD-001", coordinatorName: "Prof. Chukwuma Obi", coordinatorEmail: "c.obi@tcoefs.org", modules: [], passThreshold: 70, enrolledCount: 0, completedCount: 0, createdAt: "2026-03-10", updatedAt: "2026-03-20", requestedPublishAt: "23 Mar 2026" },
  { id: "CRS-2026-005", title: "Organic Farming Fundamentals", description: "Introduction to organic farming principles and practices.", category: "Agriculture", status: "draft", coordinatorId: "COORD-002", coordinatorName: "Dr. Fatima Mohammed", coordinatorEmail: "f.mohammed@tcoefs.org", modules: [], passThreshold: 70, enrolledCount: 0, completedCount: 0, createdAt: "2026-03-15", updatedAt: "2026-03-22" },
];

const getStatusBadge = (status: Course["status"]) => {
  const styles: Record<Course["status"], { bg: string; color: string; label: string }> = {
    draft: { bg: C.canvas, color: C.textMuted, label: "Draft" },
    pending_publish: { bg: C.warningBg, color: C.warningText, label: "Pending Review" },
    published: { bg: C.successBg, color: C.successText, label: "Published" },
    archived: { bg: "#F3F4F6", color: "#6B7280", label: "Archived" },
  };
  const s = styles[status];
  return <span style={{ padding: "4px 10px", borderRadius: 6, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
};

const thStyle: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted };

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ background: C.white, borderRadius: 8, padding: "20px 24px", boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function SuperAdminElearningPage() {
  const [liveCourses, setLiveCourses] = useState(mockCourses);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/elearning/courses?scope=all", {
          cache: "no-store",
        });
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        if (!cancelled && rows.length > 0) {
          const mapped = rows.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description || "",
            category: "E-Learning",
            status: row.status,
            coordinatorId: row.creator_id,
            coordinatorName: "Course Creator",
            modules: [],
            passThreshold: 70,
            enrolledCount: 0,
            completedCount: 0,
            createdAt: row.created_at?.slice(0, 10) || "",
            updatedAt: row.updated_at?.slice(0, 10) || "",
          }));
          setLiveCourses(mapped);
        }
      } catch {
        // keep fallback data
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<typeof mockCourses[0] | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filteredCourses = liveCourses.filter((c) => {
    const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCourses = liveCourses.filter((c) => c.status === "pending_publish");
  const publishedCount = liveCourses.filter((c) => c.status === "published").length;
  const totalParticipants = liveCourses.filter((c) => c.status === "published").reduce((sum, c) => sum + c.enrolledCount, 0);
  const totalCompletions = liveCourses.filter((c) => c.status === "published").reduce((sum, c) => sum + c.completedCount, 0);

  const openViewModal = (course: typeof mockCourses[0]) => {
    setSelectedCourse(course);
    setViewModalOpen(true);
  };

  const handleApprove = () => {
    console.log("Approved:", selectedCourse?.id);
    setApproveModalOpen(false);
    setViewModalOpen(false);
    setSelectedCourse(null);
  };

  const handleReject = () => {
    console.log("Rejected:", selectedCourse?.id, "Reason:", rejectReason);
    setRejectModalOpen(false);
    setViewModalOpen(false);
    setSelectedCourse(null);
    setRejectReason("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.canvas }}>
      <Sidebar user={{ name: "Super Admin", initials: "SA", role: "super_admin", roleLabel: "Super Admin" }} activeItem="elearning" badges={{}} />

      <main style={{ flex: 1, padding: "32px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.6px", marginBottom: 4 }}>E-Learning</h1>
          <p style={{ fontSize: 14, color: C.textSec }}>Review and manage e-learning courses</p>
        </div>

        {pendingCourses.length > 0 && (
          <div style={{ padding: "20px 24px", background: C.warningBg, border: `1px solid ${C.warningText}30`, borderRadius: 8, display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.warningText + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={24} color={C.warningText} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.warningText }}>{pendingCourses.length} course{pendingCourses.length > 1 ? "s" : ""} awaiting your review</div>
              <div style={{ fontSize: 13, color: C.warningText, marginTop: 2 }}>Click on a pending course to review details and approve or reject</div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Courses" value={liveCourses.length} icon={<BookOpen size={24} color={C.primary} />} color={C.primary} />
          <StatCard label="Published" value={publishedCount} icon={<CheckCircle size={24} color={C.successText} />} color={C.successText} />
          <StatCard label="Pending Review" value={pendingCourses.length} icon={<Clock size={24} color={C.warningText} />} color={C.warningText} />
          <StatCard label="Total Participants" value={totalParticipants} icon={<Users size={24} color={C.infoText} />} color={C.infoText} />
        </div>

        <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}` }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
              <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search courses..." style={{ height: 36, paddingLeft: 36, paddingRight: 12, border: `1px solid ${C.border}`, borderRadius: 6, background: C.canvas, fontSize: 13, color: C.text, outline: "none", width: "100%" }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 36, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.white, fontSize: 13, color: C.text, outline: "none", cursor: "pointer" }}>
              <option value="all">All Status</option>
              <option value="pending_publish">Pending Review</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: C.canvas }}>
                <th style={thStyle}>Course</th>
                <th style={thStyle}>Coordinator</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Modules</th>
                <th style={thStyle}>Enrolled</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
              </tr></thead>
              <tbody>{filteredCourses.map((course) => (
                <tr key={course.id} style={{ borderTop: `1px solid ${C.borderSubtle}`, background: course.status === "pending_publish" ? C.warningBg + "30" : "transparent", transition: "background 100ms ease", cursor: "pointer" }} onClick={() => openViewModal(course)} onMouseEnter={(e) => { if (course.status !== "pending_publish") e.currentTarget.style.background = C.canvas; }} onMouseLeave={(e) => { e.currentTarget.style.background = course.status === "pending_publish" ? C.warningBg + "30" : "transparent"; }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{course.id}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{course.title}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 13, color: C.text }}>{course.coordinatorName}</div></td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 13, color: C.text }}>{course.category}</div></td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 13, color: C.text }}>{course.modules.length}</div></td>
                  <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13, color: course.status === "published" ? C.text : C.textMuted }}>{course.status === "published" ? course.enrolledCount : "—"}</span></td>
                  <td style={{ padding: "12px 16px" }}>{getStatusBadge(course.status)}</td>
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

      {selectedCourse && (
        <>
          <div onClick={() => setViewModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, maxHeight: "90vh", background: C.white, borderRadius: 12, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: C.canvas }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>{selectedCourse.id}</span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "4px 0 0" }}>{selectedCourse.title}</h2>
              </div>
              {getStatusBadge(selectedCourse.status)}
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Coordinator</div>
                <div style={{ fontSize: 14, color: C.text }}>{selectedCourse.coordinatorName}</div>
                <div style={{ fontSize: 12, color: C.textSec }}>{selectedCourse.coordinatorEmail}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{selectedCourse.description}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Category</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selectedCourse.category}</div>
                </div>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Modules</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selectedCourse.modules.length}</div>
                </div>
                <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Pass Threshold</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selectedCourse.passThreshold}%</div>
                </div>
              </div>

              {selectedCourse.status === "published" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Enrolled</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{selectedCourse.enrolledCount}</div>
                  </div>
                  <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Completed</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.successText }}>{selectedCourse.completedCount}</div>
                  </div>
                </div>
              )}

              <div style={{ padding: 12, background: C.canvas, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Created</div>
                <div style={{ fontSize: 14, color: C.text }}>{selectedCourse.createdAt}</div>
                {selectedCourse.requestedPublishAt && <div style={{ fontSize: 12, color: C.warningText, marginTop: 4 }}>Publish requested: {selectedCourse.requestedPublishAt}</div>}
              </div>

              {selectedCourse.status === "pending_publish" && (
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
              {selectedCourse.status === "pending_publish" && (
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

      <ConfirmationModal open={approveModalOpen} title="Approve & Publish Course" message={`Approve "${selectedCourse?.title}"? It will be published immediately and available for enrollment.`} iconType="success" confirmLabel="Yes, Approve & Publish" onConfirm={handleApprove} onCancel={() => setApproveModalOpen(false)} />
      
      <ConfirmationModal open={rejectModalOpen} title="Reject Course" message={
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16 }}>Provide feedback for the coordinator on why this is being rejected.</p>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Missing content, quizzes need questions, content needs revision..." rows={4} style={{ width: "100%", padding: "12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
        </div>
      } iconType="danger" confirmLabel="Reject Course" destructive onConfirm={handleReject} onCancel={() => { setRejectModalOpen(false); setRejectReason(""); }} />
    </div>
  );
}
