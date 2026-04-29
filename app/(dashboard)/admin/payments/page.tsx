"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

type PaymentItem = {
  id: string;
  applicantName: string;
  applicantEmail: string | null;
  entityType: string;
  entityId: string;
  programmeName: string;
  amount: number;
  createdAt: string;
  paymentDate: string | null;
  dbStatus: string;
  status: "pending" | "pending_receipt" | "pending_approval" | "successful" | "failed";
  rrr: string | null;
  receiptStoragePath: string | null;
  receiptUploadedAt: string | null;
  adminApprovedAt: string | null;
  adminNotes: string | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Pending Review" },
  { value: "pending_receipt", label: "Pending Receipt" },
  { value: "successful", label: "Successful" },
  { value: "failed", label: "Failed" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; fg: string; bg: string; icon: React.ElementType }
> = {
  pending_approval: {
    label: "Pending Review",
    fg: "var(--status-warning-text)",
    bg: "var(--status-warning-bg)",
    icon: Clock,
  },
  pending_receipt: {
    label: "Awaiting Receipt",
    fg: "var(--text-primary)",
    bg: "var(--bg-surface-light)",
    icon: FileText,
  },
  successful: {
    label: "Successful",
    fg: "var(--status-success-text)",
    bg: "var(--status-success-bg)",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    fg: "var(--status-error-text)",
    bg: "var(--status-error-bg)",
    icon: XCircle,
  },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function AdminPaymentsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [approveTarget, setApproveTarget] = useState<PaymentItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Failed to load payments.");
      }
      setPayments(body.data.payments || []);
      setTotal(body.data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter, page]);

  async function approvePayment(id: string) {
    setProcessing(id);
    setMessage(null);
    setMessageTone(null);
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not approve payment.");
      }
      setMessage("Payment approved.");
      setMessageTone("success");
      setApproveTarget(null);
      void load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not approve.");
      setMessageTone("error");
    } finally {
      setProcessing(null);
    }
  }

  async function rejectPayment(id: string, reason: string) {
    if (!reason.trim()) {
      setMessage("Rejection reason is required.");
      setMessageTone("error");
      return;
    }
    setProcessing(id);
    setMessage(null);
    setMessageTone(null);
    try {
      const res = await fetch(`/api/admin/payments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not reject payment.");
      }
      setMessage("Payment rejected.");
      setMessageTone("success");
      setRejectTarget(null);
      setRejectReason("");
      void load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not reject.");
      setMessageTone("error");
    } finally {
      setProcessing(null);
    }
  }

  async function viewReceipt(id: string) {
    setProcessing(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/payments/${id}/receipt`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok || !body?.success || !body.data?.receiptUrl) {
        throw new Error(body?.error || "Could not load receipt.");
      }
      window.open(body.data.receiptUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not load receipt.");
      setMessageTone("error");
    } finally {
      setProcessing(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
      <Link href="/admin/dashboard" style={{ width: "fit-content", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <section
        style={{
          background: "var(--bg-surface-default)",
          boxShadow: "var(--elevation-2)",
          borderRadius: 20,
          padding: 22,
        }}
      >
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}
        >
          Financial workspace
        </div>
        <h1
          style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}
        >
          Payment verification
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: 760,
          }}
        >
          Review uploaded payment receipts, approve or reject submissions, and track all portal transactions.
        </p>
      </section>

      <section
        style={{
          background: "var(--bg-surface-default)",
          boxShadow: "var(--elevation-2)",
          borderRadius: 20,
          padding: 20,
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-surface-light)",
              boxShadow: "var(--shadow-inset)",
              borderRadius: 10,
              padding: "8px 12px",
              flex: 1,
              minWidth: 200,
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
              placeholder="Search by name, email, or programme..."
              style={{
                border: "none",
                background: "transparent",
                flex: 1,
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/payments?status=${opt.value}`}
                style={{
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background:
                    statusFilter === opt.value
                      ? "var(--green-primary)"
                      : "var(--bg-surface-light)",
                  color:
                    statusFilter === opt.value ? "#fff" : "var(--text-secondary)",
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-secondary)", padding: 20 }}>
            Loading payments...
          </div>
        ) : error ? (
          <div style={{ color: "var(--status-error-text)", padding: 20 }}>{error}</div>
        ) : payments.length === 0 ? (
          <div
            style={{
              color: "var(--text-secondary)",
              padding: 40,
              textAlign: "center",
            }}
          >
            No payments found.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {payments.map((payment) => {
              const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending_approval;
              const StatusIcon = status.icon;
              const needsReview = payment.status === "pending_approval" || payment.status === "pending_receipt";
              const canApprove = payment.status === "pending_approval";

              return (
                <div
                  key={payment.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "var(--bg-surface-light)",
                    borderRadius: 14,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ flex: 1, display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <User size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        {payment.applicantName}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                      <FileText size={12} />
                      {payment.programmeName}
                      <span style={{ color: "var(--text-muted)" }}>·</span>
                      {payment.entityType === "application"
                        ? "Postgraduate"
                        : payment.entityType === "training_application"
                          ? "Training"
                          : "E-Learning"}
                    </div>
                    {payment.applicantEmail && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {payment.applicantEmail}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green-primary)" }}>
                        {formatAmount(payment.amount)}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: status.bg,
                          color: status.fg,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {payment.receiptUploadedAt
                        ? `Receipt ${formatDate(payment.receiptUploadedAt)}`
                        : `Submitted ${formatDate(payment.createdAt)}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {payment.receiptUploadedAt || payment.receiptStoragePath ? (
                      <button
                        type="button"
                        onClick={() => viewReceipt(payment.id)}
                        disabled={processing === payment.id}
                        style={{
                          border: "none",
                          background: "var(--bg-surface-default)",
                          color: "var(--green-primary)",
                          borderRadius: 10,
                          boxShadow: "var(--elevation-1)",
                          padding: "8px 12px",
                          cursor: processing === payment.id ? "progress" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <ExternalLink size={12} /> {processing === payment.id ? "..." : "View receipt"}
                      </button>
                    ) : null}

                    {needsReview && (
                      <>
                      {canApprove ? (
                        <button
                          type="button"
                          onClick={() => setApproveTarget(payment)}
                          disabled={processing === payment.id}
                          style={{
                            border: "none",
                            background: "var(--status-success-bg)",
                            color: "var(--status-success-text)",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={12} /> {processing === payment.id ? "..." : "Approve"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setRejectTarget(payment);
                          setRejectReason("");
                        }}
                        disabled={processing === payment.id}
                        style={{
                          border: "none",
                          background: "var(--status-error-bg)",
                          color: "var(--status-error-text)",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <XCircle size={12} /> {processing === payment.id ? "..." : "Reject"}
                      </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingTop: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface-default)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: page <= 1 ? "default" : "pointer",
                color: page <= 1 ? "var(--text-muted)" : "var(--text-primary)",
              }}
            >
              Previous
            </button>
            <span style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface-default)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: page >= totalPages ? "default" : "pointer",
                color: page >= totalPages ? "var(--text-muted)" : "var(--text-primary)",
              }}
            >
              Next
            </button>
          </div>
        )}

        {message && (
          <div
            style={{
              color: messageTone === "error" ? "var(--status-error-text)" : "var(--green-primary)",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        {approveTarget ? (
          <div style={{ position: "fixed", inset: 0, background: "rgba(17, 27, 17, 0.38)", display: "grid", placeItems: "center", zIndex: 40 }}>
            <div style={{ width: "min(520px, calc(100vw - 32px))", background: "var(--bg-surface-default)", borderRadius: 16, boxShadow: "var(--elevation-2)", padding: 20, display: "grid", gap: 12 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-primary)" }}>Approve payment?</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                You are about to approve {approveTarget.applicantName}&apos;s payment for {approveTarget.programmeName}.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setApproveTarget(null)} disabled={processing === approveTarget.id} style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface-default)", color: "var(--text-secondary)", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={() => approvePayment(approveTarget.id)} disabled={processing === approveTarget.id} style={{ border: "none", background: "var(--status-success-bg)", color: "var(--status-success-text)", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {processing === approveTarget.id ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {rejectTarget ? (
          <div style={{ position: "fixed", inset: 0, background: "rgba(17, 27, 17, 0.38)", display: "grid", placeItems: "center", zIndex: 40 }}>
            <div style={{ width: "min(560px, calc(100vw - 32px))", background: "var(--bg-surface-default)", borderRadius: 16, boxShadow: "var(--elevation-2)", padding: 20, display: "grid", gap: 12 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-primary)" }}>Reject payment</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Enter the reason for rejecting {rejectTarget.applicantName}&apos;s payment. This reason will be stored and shown in their dashboard.
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Write rejection reason..."
                style={{ minHeight: 110, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", color: "var(--text-primary)", resize: "vertical" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={processing === rejectTarget.id} style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface-default)", color: "var(--text-secondary)", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={() => rejectPayment(rejectTarget.id, rejectReason)} disabled={processing === rejectTarget.id} style={{ border: "none", background: "var(--status-error-bg)", color: "var(--status-error-text)", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {processing === rejectTarget.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
