"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Eye,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";

type PaymentStatus =
  | "pending"
  | "pending_receipt"
  | "pending_approval"
  | "successful"
  | "failed";

interface PaymentRecord {
  id: string;
  applicantName: string;
  applicantEmail: string | null;
  programmeName: string;
  amount: number;
  createdAt: string;
  paymentDate: string | null;
  status: PaymentStatus;
  receiptUrl: string | null;
}

const C = {
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  pale: "#A8D4A8",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  errorBg: "#FEE2E2",
  errorText: "#991B1B",
  successBg: "#DCFCE7",
  successText: "#166534",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
};

const STATUS_LABELS: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: C.textSec, bg: C.canvas },
  pending_receipt: { label: "Awaiting Receipt", color: C.warningText, bg: C.warningBg },
  pending_approval: { label: "Pending Approval", color: C.primary, bg: C.whisper },
  successful: { label: "Approved", color: C.successText, bg: C.successBg },
  failed: { label: "Rejected", color: C.errorText, bg: C.errorBg },
};

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2:
    "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
};

function SuperAdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "receipt" | "approve" | "reject">("list");
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mockPayments: PaymentRecord[] = [
    {
      id: "pay_8472910384",
      applicantName: "Dr. Emmanuel Okwudili",
      applicantEmail: "emma.okwudili@gmail.com",
      programmeName: "M.Sc. Food Science & Technology",
      amount: 75000,
      createdAt: "2025-05-10T14:23:00Z",
      paymentDate: "2025-05-10T09:15:00Z",
      status: "pending_approval",
      receiptUrl: null,
    },
    {
      id: "pay_8472910112",
      applicantName: "Mrs. Folake Adenike",
      applicantEmail: "folake.adenike@yahoo.com",
      programmeName: "M.Sc. Agricultural Economics",
      amount: 50000,
      createdAt: "2025-05-09T11:45:00Z",
      paymentDate: "2025-05-09T10:30:00Z",
      status: "pending_approval",
      receiptUrl: null,
    },
    {
      id: "pay_8472909887",
      applicantName: "Mr. Chukwuemeka Nnamdi",
      applicantEmail: "chukwuemeka.nnamdi@stu.edu.ng",
      programmeName: "M.Sc. Environmental Resource Management",
      amount: 75000,
      createdAt: "2025-05-08T16:30:00Z",
      paymentDate: "2025-05-08T14:00:00Z",
      status: "pending",
      receiptUrl: null,
    },
  ];

  const filteredPayments = mockPayments.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.applicantEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.programmeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setIsSubmitting(true);
    setIsSubmitting(false);
    setSelectedPayment(null);
    setViewMode("list");
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) return;
    setIsSubmitting(true);
    setIsSubmitting(false);
    setSelectedPayment(null);
    setViewMode("list");
    setRejectReason("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar
        user={{
          name: "Super Admin",
          initials: "SA",
          role: "super_admin",
          roleLabel: "Super Admin",
        }}
        activeItem="payments"
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            height: 56,
            background: C.white,
            borderBottom: `1px solid ${C.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
              Payment Management
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: C.textSec,
              fontSize: 13,
            }}
          >
            <CreditCard size={16} />
            <span>Super Admin</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden", background: C.canvas }}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 24px",
                display: "flex",
                gap: 12,
                background: C.white,
                borderBottom: `1px solid ${C.borderSubtle}`,
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", width: 280 }}>
                <Search
                  size={14}
                  color={C.textMuted}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  placeholder="Search by name, email, or programme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    height: 36,
                    paddingLeft: 34,
                    paddingRight: 12,
                    borderRadius: 7,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 7,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  background: C.white,
                  outline: "none",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="pending_receipt">Awaiting Receipt</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="successful">Approved</option>
                <option value="failed">Rejected</option>
              </select>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  fontSize: 13,
                  color: C.textSec,
                  fontWeight: 500,
                }}
              >
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              <div
                style={{
                  background: C.white,
                  borderRadius: 10,
                  border: `1px solid ${C.borderSubtle}`,
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.canvas }}>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: C.textMuted,
                          borderBottom: `1px solid ${C.borderSubtle}`,
                        }}
                      >
                        Applicant
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: C.textMuted,
                          borderBottom: `1px solid ${C.borderSubtle}`,
                        }}
                      >
                        Programme
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: C.textMuted,
                          borderBottom: `1px solid ${C.borderSubtle}`,
                        }}
                      >
                        Amount
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: C.textMuted,
                          borderBottom: `1px solid ${C.borderSubtle}`,
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: C.textMuted,
                          borderBottom: `1px solid ${C.borderSubtle}`,
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "48px 16px",
                            textAlign: "center",
                            color: C.textMuted,
                          }}
                        >
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          style={{
                            borderBottom: `1px solid ${C.borderSubtle}`,
                          }}
                        >
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                              {payment.applicantName}
                            </div>
                            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                              {payment.applicantEmail}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, color: C.textSec }}>
                              {payment.programmeName}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              textAlign: "right",
                              fontSize: 13,
                              fontWeight: 600,
                              fontFamily: "monospace",
                            }}
                          >
                            ₦{payment.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600,
                                background: STATUS_LABELS[payment.status].bg,
                                color: STATUS_LABELS[payment.status].color,
                              }}
                            >
                              {STATUS_LABELS[payment.status].label}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              textAlign: "right",
                            }}
                          >
                            <button
                              onClick={() => {
                                setSelectedPayment(payment.id);
                                setViewMode("list");
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                height: 32,
                                padding: "0 12px",
                                borderRadius: 6,
                                border: `1px solid ${C.border}`,
                                background: C.white,
                                color: C.textSec,
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminPaymentsPage;
