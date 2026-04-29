"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Download,
} from "lucide-react";

type ApplicationDetail = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  phone: string;
  programmeTitle: string;
  programmeSlug: string;
  status: "pending" | "review" | "approved" | "rejected";
  personalStatement: string;
  submittedAt: string | null;
  createdAt: string;
  documents: Array<{
    id: string;
    documentType: string;
    filePath: string;
  }>;
  payment: {
    id: string;
    status: string;
    amount: number | null;
    receiptPath: string | null;
    receiptUploadedAt: string | null;
  } | null;
};

const DOCUMENT_LABELS: Record<string, string> = {
  transcript: "Academic Transcript",
  degree_certificate: "Degree Certificate",
  passport_photo: "Passport Photo",
  id_card: "NYSC Certificate",
  cv: "2 Referees' Letters",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; fg: string; bg: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    fg: "var(--status-warning-text)",
    bg: "var(--status-warning-bg)",
    icon: Clock,
  },
  review: {
    label: "Under review",
    fg: "var(--text-primary)",
    bg: "var(--bg-surface-light)",
    icon: FileText,
  },
  approved: {
    label: "Approved",
    fg: "var(--status-success-text)",
    bg: "var(--status-success-bg)",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
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

export default function AdminApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const applicationId = params.id;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Failed to load application.");
      }
      setApplication(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load application.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (applicationId) void load();
  }, [applicationId]);

  async function handleApprove() {
    if (!application || processing) return;
    if (!window.confirm(`Approve ${application.applicantName} for ${application.programmeTitle}?`))
      return;

    setProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", applicationId: application.id }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Failed to approve application.");
      }
      setMessage("Application approved.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to approve.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!application || processing) return;
    if (!reason.trim()) {
      setMessage("Please provide a reason for rejection.");
      return;
    }
    if (
      !window.confirm(
        `Reject ${application.applicantName} for ${application.programmeTitle}? This cannot be undone.`
      )
    )
      return;

    setProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          applicationId: application.id,
          reason: reason.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Failed to reject application.");
      }
      setMessage("Application rejected.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to reject.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleViewDocument(documentId: string) {
    if (!application || openingDocumentId) return;

    setOpeningDocumentId(documentId);
    setDocumentMessage(null);
    try {
      const res = await fetch(
        `/api/admin/applications/${application.id}/documents/${documentId}`,
        { cache: "no-store" }
      );
      const body = await res.json();
      if (!res.ok || !body?.success || !body?.data?.documentUrl) {
        throw new Error(body?.error || "Could not open document.");
      }

      const opened = window.open(
        body.data.documentUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!opened) {
        window.location.href = body.data.documentUrl;
      }
    } catch (err) {
      setDocumentMessage(
        err instanceof Error ? err.message : "Could not open document."
      );
    } finally {
      setOpeningDocumentId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--text-secondary)" }}>
        Loading application...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div style={{ padding: 24 }}>
        <Link
          href="/admin/applications"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--green-primary)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <div style={{ color: "var(--status-error-text)" }}>{error || "Application not found."}</div>
      </div>
    );
  }

  const status = STATUS_CONFIG[application.status];
  const StatusIcon = status.icon;

  return (
    <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
      <Link
        href="/admin/applications"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--green-primary)",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={14} /> Back to applications
      </Link>

      <section
        style={{
          background: "var(--bg-surface-default)",
          boxShadow: "var(--elevation-2)",
          borderRadius: 20,
          padding: 22,
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
              }}
            >
              Applicant
            </div>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: 28,
                color: "var(--text-primary)",
              }}
            >
              {application.applicantName}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 8,
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={14} /> {application.applicantEmail}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={14} /> {application.phone || "—"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 12,
              background: status.bg,
              color: status.fg,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <StatusIcon size={16} />
            {status.label}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          <GraduationCap size={14} />
          {application.programmeTitle}
        </div>

        {application.submittedAt && (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Submitted {formatDate(application.submittedAt)}
          </div>
        )}
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
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          Personal statement
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {application.personalStatement || "No personal statement provided."}
        </div>
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
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          Uploaded documents
        </div>
        {application.documents.length === 0 ? (
          <div style={{ color: "var(--text-secondary)" }}>
            No documents uploaded.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {documentMessage ? (
              <div style={{ color: "var(--status-error-text)", fontSize: 13 }}>
                {documentMessage}
              </div>
            ) : null}
            {application.documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "var(--bg-surface-light)",
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <FileText size={16} color="var(--green-primary)" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {DOCUMENT_LABELS[doc.documentType] || doc.documentType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleViewDocument(doc.id)}
                  disabled={openingDocumentId === doc.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    border: "none",
                    borderRadius: 8,
                    background: "var(--green-primary)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: openingDocumentId === doc.id ? "default" : "pointer",
                    opacity: openingDocumentId === doc.id ? 0.7 : 1,
                  }}
                >
                  <Download size={12} />
                  {openingDocumentId === doc.id ? "Opening..." : "View"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {application.payment && (
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
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Payment
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            <div style={{ background: "var(--bg-surface-light)", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Status
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  color:
                    application.payment.status === "successful"
                      ? "var(--status-success-text)"
                      : "var(--text-primary)",
                }}
              >
                {application.payment.status}
              </div>
            </div>
            <div style={{ background: "var(--bg-surface-light)", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Amount
              </div>
              <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {application.payment.amount
                  ? `₦${application.payment.amount.toLocaleString()}`
                  : "—"}
              </div>
            </div>
          </div>
          {application.payment.receiptUploadedAt && (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Receipt uploaded {formatDate(application.payment.receiptUploadedAt)}
            </div>
          )}
        </section>
      )}

      {application.status !== "approved" && application.status !== "rejected" && (
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
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Admin actions
          </div>

          {message && (
            <div
              style={{
                color: message.toLowerCase().includes("failed")
                  ? "var(--status-error-text)"
                  : "var(--status-success-text)",
                fontSize: 13,
              }}
            >
              {message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleApprove}
              disabled={processing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                border: "none",
                borderRadius: 10,
                background: "var(--status-success-bg)",
                color: "var(--status-success-text)",
                fontSize: 14,
                fontWeight: 700,
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.6 : 1,
              }}
            >
              <CheckCircle2 size={16} />
              {processing ? "Processing..." : "Approve application"}
            </button>

            <div style={{ flex: 1, minWidth: 200, display: "grid", gap: 8 }}>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rejection reason (required)"
                style={{
                  border: "none",
                  boxShadow: "var(--shadow-inset)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 14,
                  background: "var(--bg-surface-light)",
                }}
              />
              <button
                type="button"
                onClick={handleReject}
                disabled={processing || !reason.trim()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: 10,
                  background: "var(--status-error-bg)",
                  color: "var(--status-error-text)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: !reason.trim() || processing ? "not-allowed" : "pointer",
                  opacity: !reason.trim() || processing ? 0.6 : 1,
                }}
              >
                <XCircle size={16} />
                Reject application
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
