"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  RefreshCw,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { Badge } from "@/components/ui/badges/Badge";
import { ConfirmationModal } from "@/components/ui/modals/ConfirmationModal";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/super-admin/applications
   - Purpose: Fetch all applications with full visibility
   - Query params: status, programme, date_from, date_to, assigned_to, search, page, limit
   - Response: { applications: Application[], total: number, page: number, pages: number }
   - Auth: Super Admin only
   
   GET /api/super-admin/applications/:id
   - Purpose: Fetch single application details
   - Response: { application: ApplicationDetail }
   - Auth: Super Admin only
   
   POST /api/super-admin/applications/:id/approve
   - Purpose: Approve an application
   - Body: { reason?: string }
   - Response: { success: boolean, application: Application }
   - Side effects: Updates status, triggers email notification
   - Auth: Super Admin only
   
   POST /api/super-admin/applications/:id/reject
   - Purpose: Reject an application
   - Body: { reason: string }
   - Response: { success: boolean, application: Application }
   - Auth: Super Admin only
   
   POST /api/super-admin/applications/bulk-approve
   - Purpose: Bulk approve multiple applications
   - Body: { ids: string[], reason?: string }
   - Response: { success: boolean, approved: number, failed: number }
   - Auth: Super Admin only
   
   POST /api/super-admin/applications/bulk-reject
   - Purpose: Bulk reject multiple applications
   - Body: { ids: string[], reason: string }
   - Response: { success: boolean, rejected: number, failed: number }
   - Auth: Super Admin only
   ============================================================================ */

const C = {
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  light: "#56985E",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  warningText: "#92400E",
  infoText: "#1E40AF",
  successBg: "#DCFCE7",
  successText: "#166534",
  errorBg: "#FEE2E2",
  errorText: "#991B1B",
  purpleBg: "#EDE9FE",
  purpleText: "#5B21B6",
};

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev1: "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
};

interface Application {
  id: string;
  name: string;
  email: string;
  programme: string;
  submitted: string;
  status: "pending" | "review" | "approved" | "rejected";
  documents: string;
  assignedTo: string;
  officerNotes?: string;
  urgent?: boolean;
}

interface FilterState {
  search: string;
  status: string;
  programme: string;
  dateFrom: string;
  dateTo: string;
  assignedTo: string;
}

const mockApplications: Application[] = [
  { id: "APP-2026-0247", name: "Chiamaka Okonkwo", email: "chiamaka.okonkwo@gmail.com", programme: "MSc Food Science & Technology", submitted: "22 Mar 2026", status: "pending", documents: "6/6", assignedTo: "Dr. Ibrahim Yusuf", urgent: false },
  { id: "APP-2026-0246", name: "Abubakar Ibrahim", email: "abubakar.ibrahim@stu.edu.ng", programme: "MSc Agricultural Economics", submitted: "21 Mar 2026", status: "review", documents: "5/6", assignedTo: "Dr. Fatima Mohammed", urgent: true },
  { id: "APP-2026-0245", name: "Ngozi Eze", email: "ngozi.eze@gmail.com", programme: "MSc Environmental Resource Management", submitted: "20 Mar 2026", status: "pending", documents: "6/6", assignedTo: "Dr. Ibrahim Yusuf", urgent: false },
  { id: "APP-2026-0244", name: "Ibrahim Musa", email: "ibrahim.musa@stu.edu.ng", programme: "MSc Agricultural Science", submitted: "19 Mar 2026", status: "review", documents: "6/6", assignedTo: "Mrs. Grace Adeyemi", urgent: false },
  { id: "APP-2026-0243", name: "Amina Bello", email: "amina.bello@gmail.com", programme: "MSc Food Science & Technology", submitted: "18 Mar 2026", status: "pending", documents: "5/6", assignedTo: "Dr. Fatima Mohammed", urgent: true },
  { id: "APP-2026-0242", name: "Emeka Nwosu", email: "emeka.nwosu@stu.edu.ng", programme: "PGD Food Technology", submitted: "17 Mar 2026", status: "approved", documents: "6/6", assignedTo: "Dr. Ibrahim Yusuf", urgent: false },
  { id: "APP-2026-0241", name: "Blessing Okafor", email: "blessing.okafor@gmail.com", programme: "MSc Agricultural Economics", submitted: "16 Mar 2026", status: "pending", documents: "6/6", assignedTo: "Mrs. Grace Adeyemi", urgent: false },
  { id: "APP-2026-0240", name: "Yusuf Abdullahi", email: "yusuf.abdullahi@stu.edu.ng", programme: "MSc Environmental Resource Management", submitted: "15 Mar 2026", status: "rejected", documents: "4/6", assignedTo: "Dr. Ibrahim Yusuf", urgent: false },
];

const mockProgrammes = ["All Programmes", "MSc Food Science & Technology", "MSc Agricultural Economics", "MSc Agricultural Science", "MSc Environmental Resource Management", "PGD Food Technology"];
const mockOfficers = ["All Officers", "Dr. Ibrahim Yusuf", "Dr. Fatima Mohammed", "Mrs. Grace Adeyemi"];
const mockStatuses = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function SuperAdminApplicationsPage() {
  const [filters, setFilters] = useState<FilterState>({ search: "", status: "all", programme: "All Programmes", dateFrom: "", dateTo: "", assignedTo: "All Officers" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (selectedIds.size === mockApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mockApplications.map((a) => a.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) { newSelected.delete(id); } else { newSelected.add(id); }
    setSelectedIds(newSelected);
  };

  const statusCounts = { all: mockApplications.length, pending: mockApplications.filter((a) => a.status === "pending").length, review: mockApplications.filter((a) => a.status === "review").length, approved: mockApplications.filter((a) => a.status === "approved").length, rejected: mockApplications.filter((a) => a.status === "rejected").length };
  const hasActiveFilters = filters.search || filters.status !== "all" || filters.programme !== "All Programmes" || filters.dateFrom || filters.dateTo || filters.assignedTo !== "All Officers";

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.canvas }}>
      <Sidebar user={{ name: "Super Admin", initials: "SA", role: "super_admin", roleLabel: "Super Admin" }} activeItem="applications" badges={{}} />

      <main style={{ flex: 1, padding: "32px 40px" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.6px", marginBottom: 4 }}>Applications</h1>
            <p style={{ fontSize: 14, color: C.textSec }}>Full system view of all applications</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ height: 40, padding: "0 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: shadow.sm }}>
              <Download size={14} />Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.canvas, display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={20} color={C.textMuted} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{mockApplications.length}</div><div style={{ fontSize: 12, color: C.textMuted }}>Total</div></div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.warningText + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><Clock size={20} color={C.warningText} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{statusCounts.pending}</div><div style={{ fontSize: 12, color: C.textMuted }}>Pending</div></div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.successText + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle size={20} color={C.successText} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{statusCounts.approved}</div><div style={{ fontSize: 12, color: C.textMuted }}>Approved</div></div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, padding: 16, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.errorText + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><XCircle size={20} color={C.errorText} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{statusCounts.rejected}</div><div style={{ fontSize: 12, color: C.textMuted }}>Rejected</div></div>
          </div>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.white, padding: 4, borderRadius: 8, boxShadow: shadow.sm, width: "fit-content" }}>
          {mockStatuses.map((status) => (
            <button key={status.value} onClick={() => setFilters({ ...filters, status: status.value })} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: filters.status === status.value ? C.primary : "transparent", color: filters.status === status.value ? C.white : C.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {status.label}<span style={{ background: filters.status === status.value ? "rgba(255,255,255,0.2)" : C.canvas, padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>{statusCounts[status.value as keyof typeof statusCounts]}</span>
            </button>
          ))}
        </div>

        <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}` }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1, maxWidth: 320 }}>
              <Search size={14} style={{ position: "absolute", left: 12, color: C.textMuted, pointerEvents: "none" }} />
              <input type="search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search by name, ID, or email..." style={{ height: 36, paddingLeft: 36, paddingRight: 12, border: `1px solid ${C.border}`, borderRadius: 6, background: C.canvas, fontSize: 13, color: C.text, outline: "none", width: "100%" }} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} style={{ height: 36, padding: "0 14px", borderRadius: 6, border: `1px solid ${showFilters ? C.primary : C.border}`, background: showFilters ? C.whisper : C.white, color: showFilters ? C.primary : C.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={14} />Filters<ChevronDown size={14} style={{ transform: showFilters ? "rotate(180deg)" : "none" }} />
            </button>
            {selectedIds.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>{selectedIds.size} selected</span>
                <button onClick={() => setBulkApproveModalOpen(true)} style={{ height: 32, padding: "0 12px", borderRadius: 4, border: "none", background: C.successBg, color: C.successText, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><CheckCircle size={12} />Approve All</button>
                <button onClick={() => setBulkRejectModalOpen(true)} style={{ height: 32, padding: "0 12px", borderRadius: 4, border: "none", background: C.errorBg, color: C.errorText, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><XCircle size={12} />Reject All</button>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: C.canvas }}>
                <th style={{ padding: "10px 16px", width: 48 }}><button onClick={handleSelectAll} style={{ background: "none", border: "none", cursor: "pointer", color: selectedIds.size === mockApplications.length ? C.primary : C.textMuted }}>{selectedIds.size === mockApplications.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th>
                <th style={thStyle}>Application</th>
                <th style={thStyle}>Applicant</th>
                <th style={thStyle}>Programme</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Docs</th>
                <th style={thStyle}>Assigned To</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr></thead>
              <tbody>{mockApplications.map((app) => (
                <tr key={app.id} style={{ borderTop: `1px solid ${C.borderSubtle}`, background: selectedIds.has(app.id) ? C.whisper : "transparent", transition: "background 100ms ease" }}>
                  <td style={{ padding: "12px 16px" }}><button onClick={(e) => { e.stopPropagation(); handleSelectRow(app.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: selectedIds.has(app.id) ? C.primary : C.textMuted }}>{selectedIds.has(app.id) ? <CheckSquare size={16} /> : <Square size={16} />}</button></td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{app.urgent && <AlertTriangle size={14} color={C.warningText} />}
                      <div><div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 500, color: C.textMuted }}>{app.id}</div><div style={{ fontSize: 12, color: C.textSec, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><Calendar size={11} />{app.submitted}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{app.name}</div><div style={{ fontSize: 12, color: C.textSec }}>{app.email}</div></td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 13, color: C.text }}>{app.programme}</div></td>
                  <td style={{ padding: "12px 16px" }}><Badge variant={app.status} /></td>
                  <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13, fontWeight: 600, color: app.documents === "6/6" ? C.successText : C.warningText }}>{app.documents}</span></td>
                  <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 13, color: C.text }}>{app.assignedTo}</div></td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button style={{ height: 28, padding: "0 10px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.white, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} />View</button>
                      {app.status !== "approved" && app.status !== "rejected" && (<><button onClick={() => { setSelectedApp(app.id); setApproveModalOpen(true); }} style={{ height: 28, padding: "0 10px", borderRadius: 4, border: "none", background: C.successBg, color: C.successText, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓</button><button onClick={() => { setSelectedApp(app.id); setRejectModalOpen(true); }} style={{ height: 28, padding: "0 10px", borderRadius: 4, border: "none", background: C.errorBg, color: C.errorText, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✕</button></>)}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Showing {mockApplications.length} of {mockApplications.length} applications</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button disabled={currentPage === 1} style={{ height: 32, width: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: C.white, color: currentPage === 1 ? C.textMuted : C.textSec, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, padding: "0 12px" }}>Page {currentPage} of 1</span>
              <button disabled style={{ height: 32, width: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: C.white, color: C.textMuted, cursor: "not-allowed", opacity: 0.5 }}><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationModal open={approveModalOpen} title="Approve Application" message={`Approve application ${selectedApp}?`} iconType="success" confirmLabel="Approve" onConfirm={() => setApproveModalOpen(false)} onCancel={() => setApproveModalOpen(false)} />
      <ConfirmationModal open={rejectModalOpen} title="Reject Application" message={`Reject application ${selectedApp}?`} iconType="danger" confirmLabel="Reject" destructive onConfirm={() => setRejectModalOpen(false)} onCancel={() => setRejectModalOpen(false)} />
      <ConfirmationModal open={bulkApproveModalOpen} title="Approve Multiple" message={`Approve ${selectedIds.size} selected applications?`} iconType="success" confirmLabel={`Approve ${selectedIds.size}`} onConfirm={() => { setBulkApproveModalOpen(false); setSelectedIds(new Set()); }} onCancel={() => setBulkApproveModalOpen(false)} />
      <ConfirmationModal open={bulkRejectModalOpen} title="Reject Multiple" message={`Reject ${selectedIds.size} selected applications?`} iconType="danger" confirmLabel={`Reject ${selectedIds.size}`} destructive onConfirm={() => { setBulkRejectModalOpen(false); setSelectedIds(new Set()); }} onCancel={() => setBulkRejectModalOpen(false)} />
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted };
