"use client";

import React, { useState } from "react";
import { Calendar, FileText, Users, CreditCard, BookOpen, GraduationCap } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/super-admin/reports/applications
   - Purpose: Get application summary for all system
   - Query params: date_from, date_to
   - Response: { applications: ApplicationSummary[] }
   - Auth: Super Admin only
   
   GET /api/super-admin/reports/training
   - Purpose: Get training registration summary
   - Query params: date_from, date_to
   - Response: { registrations: RegistrationSummary[] }
   - Auth: Super Admin only
   
   GET /api/super-admin/reports/elearning
   - Purpose: Get e-learning enrollment summary
   - Query params: date_from, date_to
   - Response: { enrollments: EnrollmentSummary[] }
   - Auth: Super Admin only
   
   GET /api/super-admin/reports/payments
   - Purpose: Get payment summary
   - Query params: date_from, date_to
   - Response: { payments: PaymentSummary[] }
   - Auth: Super Admin only
   ============================================================================ */

type ReportTab = "applications" | "training" | "elearning" | "payments";

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
};

const shadow = { elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12)" };

const mockApplications = [
  { id: "APP-001", applicant: "Aisha Mohammed", programme: "TCoEFS Foundation Programme 2026", status: "approved", appliedDate: "10 Mar 2026" },
  { id: "APP-002", applicant: "Babatunde Adeyemi", programme: "TCoEFS Foundation Programme 2026", status: "pending", appliedDate: "12 Mar 2026" },
  { id: "APP-003", applicant: "Chidi Okonkwo", programme: "TCoEFS Foundation Programme 2026", status: "approved", appliedDate: "15 Mar 2026" },
  { id: "APP-004", applicant: "Grace Nwosu", programme: "TCoEFS Foundation Programme 2026", status: "rejected", appliedDate: "18 Mar 2026" },
  { id: "APP-005", applicant: "Emeka Eze", programme: "TCoEFS Foundation Programme 2026", status: "pending", appliedDate: "20 Mar 2026" },
];

const mockTrainingRegistrations = [
  { id: "REG-001", participant: "Aisha Mohammed", training: "Climate-Smart Agriculture Workshop", status: "registered", registeredDate: "10 Mar 2026" },
  { id: "REG-002", participant: "Babatunde Adeyemi", training: "Post-Harvest Management Techniques", status: "registered", registeredDate: "12 Mar 2026" },
  { id: "REG-003", participant: "Chidi Okonkwo", training: "Food Safety & Quality Assurance", status: "attended", registeredDate: "08 Mar 2026" },
  { id: "REG-004", participant: "Grace Nwosu", training: "Climate-Smart Agriculture Workshop", status: "registered", registeredDate: "15 Mar 2026" },
  { id: "REG-005", participant: "Emeka Eze", training: "Value Chain Analysis Workshop", status: "cancelled", registeredDate: "05 Mar 2026" },
];

const mockElearningEnrollments = [
  { id: "ENR-001", participant: "Fatima Ibrahim", course: "Sustainable Food Systems Management", status: "completed", enrolledDate: "01 Mar 2026", progress: "100%" },
  { id: "ENR-002", participant: "Ibrahim Musa", course: "Agricultural Value Chain Analysis", status: "in_progress", enrolledDate: "05 Mar 2026", progress: "45%" },
  { id: "ENR-003", participant: "Joy Adaeze", course: "Sustainable Food Systems Management", status: "in_progress", enrolledDate: "08 Mar 2026", progress: "30%" },
  { id: "ENR-004", participant: "Kemi Olatunji", course: "Post-Harvest Loss Reduction", status: "enrolled", enrolledDate: "12 Mar 2026", progress: "0%" },
  { id: "ENR-005", participant: "Ladi Yusuf", course: "Agricultural Value Chain Analysis", status: "completed", enrolledDate: "15 Mar 2026", progress: "100%" },
];

const mockPayments = [
  { id: "PAY-001", applicant: "Aisha Mohammed", programme: "Climate-Smart Agriculture Workshop", amount: 50000, status: "successful", date: "10 Mar 2026" },
  { id: "PAY-002", applicant: "Babatunde Adeyemi", programme: "Post-Harvest Management Techniques", amount: 35000, status: "pending", date: "12 Mar 2026" },
  { id: "PAY-003", applicant: "Chidi Okonkwo", programme: "Food Safety & Quality Assurance", amount: 75000, status: "successful", date: "08 Mar 2026" },
  { id: "PAY-004", applicant: "Grace Nwosu", programme: "TCoEFS Application Fee", amount: 10000, status: "successful", date: "15 Mar 2026" },
  { id: "PAY-005", applicant: "Fatima Ibrahim", programme: "Sustainable Food Systems Management", amount: 25000, status: "successful", date: "01 Mar 2026" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    approved: { bg: C.successBg, color: C.successText }, pending: { bg: C.warningBg, color: C.warningText }, rejected: { bg: "#FEE2E2", color: "#991B1B" },
    registered: { bg: C.infoBg, color: C.infoText }, attended: { bg: C.successBg, color: C.successText }, cancelled: { bg: "#FEE2E2", color: "#991B1B" },
    completed: { bg: C.successBg, color: C.successText }, in_progress: { bg: C.infoBg, color: C.infoText }, enrolled: { bg: C.whisper, color: C.primary },
    successful: { bg: C.successBg, color: C.successText }, failed: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const style = styles[status] || { bg: C.canvas, color: C.textSec };
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 8, background: style.bg, color: style.color, fontSize: 11, fontWeight: 600 }}>{label}</span>;
};

const thStyle: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted };

export default function SuperAdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("applications");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const tabs = [
    { key: "applications" as ReportTab, label: "Applications", icon: FileText, count: mockApplications.length },
    { key: "training" as ReportTab, label: "Training", icon: GraduationCap, count: mockTrainingRegistrations.length },
    { key: "elearning" as ReportTab, label: "E-Learning", icon: BookOpen, count: mockElearningEnrollments.length },
    { key: "payments" as ReportTab, label: "Payments", icon: CreditCard, count: mockPayments.length },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case "applications": return (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: C.canvas }}><th style={thStyle}>ID</th><th style={thStyle}>Applicant</th><th style={thStyle}>Programme</th><th style={{ ...thStyle, textAlign: "center" }}>Status</th><th style={thStyle}>Date</th></tr></thead>
          <tbody>{mockApplications.map((app) => (<tr key={app.id} style={{ borderTop: `1px solid ${C.borderSubtle}` }}><td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>{app.id}</td><td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>{app.applicant}</td><td style={{ padding: "12px 16px", fontSize: 13, color: C.textSec }}>{app.programme}</td><td style={{ padding: "12px 16px", textAlign: "center" }}>{getStatusBadge(app.status)}</td><td style={{ padding: "12px 16px", fontSize: 13 }}>{app.appliedDate}</td></tr>))}</tbody>
        </table>
      );
      case "training": return (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: C.canvas }}><th style={thStyle}>ID</th><th style={thStyle}>Participant</th><th style={thStyle}>Training</th><th style={{ ...thStyle, textAlign: "center" }}>Status</th><th style={thStyle}>Date</th></tr></thead>
          <tbody>{mockTrainingRegistrations.map((reg) => (<tr key={reg.id} style={{ borderTop: `1px solid ${C.borderSubtle}` }}><td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>{reg.id}</td><td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>{reg.participant}</td><td style={{ padding: "12px 16px", fontSize: 13, color: C.textSec }}>{reg.training}</td><td style={{ padding: "12px 16px", textAlign: "center" }}>{getStatusBadge(reg.status)}</td><td style={{ padding: "12px 16px", fontSize: 13 }}>{reg.registeredDate}</td></tr>))}</tbody>
        </table>
      );
      case "elearning": return (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: C.canvas }}><th style={thStyle}>ID</th><th style={thStyle}>Participant</th><th style={thStyle}>Course</th><th style={{ ...thStyle, textAlign: "center" }}>Status</th><th style={{ ...thStyle, textAlign: "center" }}>Progress</th></tr></thead>
          <tbody>{mockElearningEnrollments.map((enr) => (<tr key={enr.id} style={{ borderTop: `1px solid ${C.borderSubtle}` }}><td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>{enr.id}</td><td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>{enr.participant}</td><td style={{ padding: "12px 16px", fontSize: 13, color: C.textSec }}>{enr.course}</td><td style={{ padding: "12px 16px", textAlign: "center" }}>{getStatusBadge(enr.status)}</td><td style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600 }}>{enr.progress}</td></tr>))}</tbody>
        </table>
      );
      case "payments": return (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: C.canvas }}><th style={thStyle}>ID</th><th style={thStyle}>Applicant</th><th style={thStyle}>Programme</th><th style={{ ...thStyle, textAlign: "right" }}>Amount</th><th style={{ ...thStyle, textAlign: "center" }}>Status</th></tr></thead>
          <tbody>{mockPayments.map((pay) => (<tr key={pay.id} style={{ borderTop: `1px solid ${C.borderSubtle}` }}><td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>{pay.id}</td><td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>{pay.applicant}</td><td style={{ padding: "12px 16px", fontSize: 13, color: C.textSec }}>{pay.programme}</td><td style={{ padding: "12px 16px", textAlign: "right", fontSize: 14, fontWeight: 700 }}>₦{pay.amount.toLocaleString()}</td><td style={{ padding: "12px 16px", textAlign: "center" }}>{getStatusBadge(pay.status)}</td></tr>))}</tbody>
        </table>
      );
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.canvas }}>
      <Sidebar user={{ name: "Super Admin", initials: "SA", role: "super_admin", roleLabel: "Super Admin" }} activeItem="reports" badges={{}} />

      <main style={{ flex: 1, padding: "32px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.6px", marginBottom: 4 }}>Reports</h1>
          <p style={{ fontSize: 14, color: C.textSec }}>Full system reports across all modules</p>
        </div>

        <div style={{ background: C.white, borderRadius: 8, padding: "16px 20px", marginBottom: 16, display: "flex", gap: 16, alignItems: "center", boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={16} color={C.textMuted} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Date Range</span></div>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.canvas, fontSize: 13, color: C.text, outline: "none" }} />
          <span style={{ color: C.textMuted }}>to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ height: 40, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 6, background: C.canvas, fontSize: 13, color: C.text, outline: "none" }} />
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.borderSubtle}` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "12px 20px", border: "none", background: "transparent", color: isActive ? C.primary : C.textSec, fontSize: 14, fontWeight: 600, cursor: "pointer", borderBottom: isActive ? `2px solid ${C.primary}` : "2px solid transparent", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={16} />{tab.label}<span style={{ padding: "2px 8px", borderRadius: 10, background: isActive ? C.whisper : C.canvas, color: isActive ? C.primary : C.textMuted, fontSize: 12 }}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}`, overflow: "hidden" }}>{renderTable()}</div>
      </main>
    </div>
  );
}
