"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Upload,
  User,
  X,
} from "lucide-react";
import { signOutAndRedirect } from "@/lib/auth/client-signout";
import { PageLoading } from "@/components/ui";

export const dynamic = "force-dynamic";

const C = {
  darkest: "#0F2210",
  dark: "#1A3A1A",
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  light: "#56985E",
  pale: "#A8D4A8",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  gold: "#C49A26",
  goldWhisper: "#FDF3D0",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  warningText: "#92400E",
  warningBg: "#FEF3C7",
  infoText: "#1E40AF",
  infoBg: "#DBEAFE",
  successText: "#166534",
  successBg: "#DCFCE7",
  errorText: "#991B1B",
  errorBg: "#FEE2E2",
} as const;

type ApplicationState = "start" | "in_progress" | "approved" | "rejected";

interface DashboardSnapshot {
  name: string;
  initials: string;
  applicationState: ApplicationState;
  currentStep: number;
  requiredDocuments: number;
  uploadedDocuments: number;
  missingDocuments: string[];
  programmeLabel: string;
  applicationPublicId: string;
  lastSavedLabel: string;
  paymentStatus:
    | "pending"
    | "pending_receipt"
    | "pending_approval"
    | "successful"
    | "failed"
    | "none";
  paymentId: string | null;
  paymentAmount: number | null;
  applicationId: string | null;
  rejectionHistory: Array<{
    applicationPublicId: string;
    programmeLabel: string;
    rejectedAt: string;
    reason: string;
  }>;
}

const REQUIRED_DOCUMENT_LABELS = [
  "Academic Transcript",
  "Degree Certificate",
  "Passport Photo",
  "NYSC Certificate",
  "2 Referees' Letters",
] as const;

function initialsFromName(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AP"
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "under_review" | "approved" | "rejected" | "incomplete" | "not_started";
}) {
  const map = {
    pending: { label: "Pending", fg: C.warningText, bg: C.warningBg },
    under_review: { label: "Under Review", fg: C.infoText, bg: C.infoBg },
    approved: { label: "Approved", fg: C.successText, bg: C.successBg },
    rejected: { label: "Rejected", fg: C.errorText, bg: C.errorBg },
    incomplete: { label: "Incomplete", fg: C.warningText, bg: C.warningBg },
    not_started: { label: "Not Started", fg: C.textMuted, bg: "#F3F4F6" },
  } as const;

  const tone = map[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        color: tone.fg,
        background: tone.bg,
        borderRadius: 999,
        padding: "3px 10px",
      }}
    >
      {tone.label}
    </span>
  );
}

function Sidebar({
  activeItem,
  open,
}: {
  activeItem: "dashboard" | "documents" | "help";
  open: boolean;
}) {
  const router = useRouter();
  const nav = [
    { id: "dashboard" as const, label: "Dashboard", href: "/applicant/dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "documents" as const, label: "Documents", href: "/applicant/documents", icon: <Upload size={16} /> },
    { id: "help" as const, label: "Help", href: "/applicant/help", icon: <HelpCircle size={16} /> },
  ];

  return (
    <aside
      style={{
        width: open ? 246 : 0,
        transition: "width 220ms ease",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 20% 0%, rgba(168,212,168,0.1), transparent 45%), linear-gradient(180deg, #123112 0%, #0F2210 70%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "22px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.94)", letterSpacing: "-0.2px" }}>TCoEFS Portal</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>University of Jos · Applicant Console</div>
      </div>

      <div style={{ padding: "12px 16px 8px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.55px",
            textTransform: "uppercase",
            color: C.pale,
            background: "rgba(168,212,168,0.12)",
            border: "1px solid rgba(168,212,168,0.2)",
            borderRadius: 999,
            padding: "4px 9px",
          }}
        >
          Postgraduate Applicant
        </span>
      </div>

      <nav style={{ flex: 1, padding: "6px 10px" }}>
        {nav.map((item) => {
          const active = item.id === activeItem;
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 11px",
                marginBottom: 4,
                borderRadius: 9,
                textDecoration: "none",
                border: active ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.62)",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={() => signOutAndRedirect(router)}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 9,
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.76)",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "10px 11px",
            cursor: "pointer",
          }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function TopBar({
  name,
  open,
  onToggle,
}: {
  name: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <header
      style={{
        height: 58,
        borderBottom: `1px solid ${C.borderSubtle}`,
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggle}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            width: 34,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.textSec,
            background: C.white,
            cursor: "pointer",
          }}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Applicant Dashboard</div>
          <div style={{ fontSize: 10.5, color: C.textMuted }}>Postgraduate admissions workflow</div>
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          border: `1px solid ${C.border}`,
          borderRadius: 999,
          padding: "4px 10px 4px 5px",
          background: C.white,
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: C.whisper,
            color: C.primary,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={13} />
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{name}</span>
      </div>
    </header>
  );
}

function StepRail({ current }: { current: number }) {
  const labels = ["Programme", "Personal", "Documents", "Payment", "Review"];

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${C.borderSubtle}`,
        background: C.white,
        padding: "14px 14px",
        overflowX: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", minWidth: 620 }}>
        {labels.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          return (
            <React.Fragment key={label}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 84 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: done || active ? "none" : `1px solid ${C.border}`,
                    background: done ? C.primary : active ? C.medium : C.white,
                    color: done || active ? C.white : C.textMuted,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {done ? <CheckCircle2 size={14} /> : step}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color: active ? C.primary : C.textMuted }}>{label}</span>
              </div>
              {index < labels.length - 1 && (
                <div style={{ flex: 1, minWidth: 18, height: 2, background: done ? C.light : C.borderSubtle, marginTop: -14 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function DocumentItem({
  label,
  missing,
}: {
  label: string;
  missing: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        borderBottom: `1px solid ${C.borderSubtle}`,
        padding: "9px 0",
      }}
    >
      {missing ? <AlertCircle size={14} color={C.warningText} style={{ marginTop: 2, flexShrink: 0 }} /> : <CheckCircle2 size={14} color={C.successText} style={{ marginTop: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{label}</div>
        <div style={{ fontSize: 11, color: missing ? C.warningText : C.successText, marginTop: 2 }}>{missing ? "Required - not uploaded" : "Uploaded"}</div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "3px 7px",
          borderRadius: 999,
          color: missing ? C.warningText : C.successText,
          background: missing ? C.warningBg : C.successBg,
          marginTop: 1,
        }}
      >
        {missing ? "Missing" : "Done"}
      </span>
    </div>
  );
}

function Hero({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: `radial-gradient(circle at 88% 14%, rgba(168,212,168,0.18), transparent 28%), linear-gradient(140deg, ${C.dark} 0%, ${C.darkest} 58%, #1f3e1f 100%)`,
        color: "rgba(255,255,255,0.9)",
        padding: "22px 20px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", opacity: 0.56, marginBottom: 7 }}>
          Welcome Back
        </div>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.5px", lineHeight: 1.08 }}>{title}</h1>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>{subtitle}</p>
      </div>
      {right}
    </section>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}

function isAllowedUploadType(contentType: string) {
  return (
    contentType === "application/pdf" ||
    contentType === "image/jpeg" ||
    contentType === "image/png"
  );
}

function PaymentActionPanel({
  snapshot,
}: {
  snapshot: DashboardSnapshot;
}) {
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [bankDetails, setBankDetails] = useState({
    bankName: "Access Bank PLC",
    accountNumber: "1886573891",
    accountName: "University of Jos External Funded Account",
    amount: 25000,
    instructions:
      "Transfer the exact amount and upload your transfer receipt for review.",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payments/bank-details", { method: "GET" });
        const body = await res.json();
        if (!res.ok || !body?.success || !body?.data) return;
        setBankDetails({
          bankName: body.data.bankName || "Access Bank PLC",
          accountNumber: body.data.accountNumber || "1886573891",
          accountName:
            body.data.accountName || "University of Jos External Funded Account",
          amount: Number(body.data.amount || 25000),
          instructions:
            body.data.instructions ||
            "Transfer the exact amount and upload your transfer receipt for review.",
        });
      } catch {
        // Keep defaults.
      }
    })();
  }, []);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(bankDetails.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const uploadReceipt = async () => {
    if (!receipt) {
      setIssues(["Select a receipt file before submitting."]);
      return;
    }

    if (!isAllowedUploadType(receipt.type)) {
      setIssues(["Accepted receipt formats are PDF, JPG, and PNG."]);
      return;
    }

    if (receipt.size > 10 * 1024 * 1024) {
      setIssues(["Receipt file size must not exceed 10MB."]);
      return;
    }

    if (!snapshot.applicationId) {
      setIssues(["Application is not ready for payment yet."]);
      return;
    }

    setUploading(true);
    setIssues([]);

    try {
      let paymentId = snapshot.paymentId;
      if (!paymentId) {
        const createRes = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "application",
            entityId: snapshot.applicationId,
            amount: snapshot.paymentAmount || bankDetails.amount || 25000,
          }),
        });
        const createBody = await createRes.json();
        if (!createRes.ok || !createBody?.success) {
          throw new Error(createBody?.error || "Unable to create payment record.");
        }
        paymentId = (createBody.data?.paymentId as string | undefined) || null;
      }

      if (!paymentId) {
        throw new Error("Payment ID was not returned by the server.");
      }

      const formData = new FormData();
      formData.set("paymentId", paymentId);
      formData.set("file", receipt);

      const res = await fetch("/api/payments/receipt", {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Unable to submit payment receipt.");
      }

      window.location.href = "/applicant/application/5";
    } catch (error) {
      setIssues([
        error instanceof Error
          ? error.message
          : "Unable to upload receipt right now.",
      ]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <article className="applicant-card" style={{ padding: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.65px", color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>
        Payment Submission
      </div>
      <div style={{ borderRadius: 10, border: `1px solid ${C.borderSubtle}`, background: "linear-gradient(180deg, #F5FAF5 0%, var(--green-whisper) 100%)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={16} color={C.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Bank Transfer Details</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 7, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>Bank</span>
          <strong style={{ fontSize: 14, color: C.text }}>{bankDetails.bankName}</strong>
          <span style={{ fontSize: 12, color: C.textMuted }}>Account Number</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifySelf: "end" }}>
            <strong style={{ fontSize: 26, letterSpacing: "0.4px", lineHeight: 1, color: C.text, fontFamily: "var(--font-geist-mono, monospace)" }}>{bankDetails.accountNumber}</strong>
            <button type="button" onClick={copyAccountNumber} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 6, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            </button>
          </div>
          <span style={{ fontSize: 12, color: C.textMuted }}>Account Name</span>
          <strong style={{ fontSize: 14, color: C.text }}>{bankDetails.accountName}</strong>
          <span style={{ fontSize: 12, color: C.textMuted }}>Amount</span>
          <strong style={{ fontSize: 22, color: C.primary }}>{currency(snapshot.paymentAmount || bankDetails.amount || 25000)}</strong>
        </div>
      </div>

      <div style={{ marginTop: 12, borderRadius: 10, border: `1px dashed ${C.border}`, padding: 12, display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12.5, color: C.textSec }}>Upload payment receipt (PDF, JPG, PNG, max 10MB)</div>
        <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setReceipt(event.target.files?.[0] || null)} style={{ fontSize: 12.5 }} />
        <button onClick={uploadReceipt} disabled={uploading} style={{ height: 40, border: "none", borderRadius: 9, padding: "0 14px", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1, width: "fit-content" }}>
          {uploading ? "Uploading..." : "I've Made the Transfer"}
        </button>
      </div>

      {issues.length > 0 ? (
        <div style={{ marginTop: 10, color: C.errorText, background: C.errorBg, borderRadius: 8, padding: "9px 10px", fontSize: 12 }}>
          {issues.map((issue) => (
            <div key={issue}>{issue}</div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function StartState({ snapshot }: { snapshot: DashboardSnapshot }) {
  const beginPath = "/applicant/application/1?begin=1";
  const missing = REQUIRED_DOCUMENT_LABELS;

  return (
    <>
      <Hero
        title={snapshot.name}
        subtitle="Your postgraduate application has not started yet. Begin with programme selection and complete the guided workflow."
        right={
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.14)",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {initialsFromName(snapshot.name)}
          </div>
        }
      />

      <section className="applicant-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: C.whisper, color: C.primary, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={18} />
              </span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Start a New Application</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>5-step guided postgraduate admissions workflow</div>
              </div>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: C.textSec, lineHeight: 1.65 }}>
              Select your programme, complete personal information, upload all required documents, submit payment receipt, and move to review.
            </p>
            <Link
              href={beginPath}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 42,
                padding: "0 16px",
                borderRadius: 9,
                textDecoration: "none",
                color: C.white,
                background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Begin Programme Selection
              <ChevronRight size={15} />
            </Link>
          </article>

          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.65px", color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>
              Application Snapshot
            </div>
            <div className="applicant-ledger">
              <div>
                <span>Application ID</span>
                <strong>-</strong>
              </div>
              <div>
                <span>Status</span>
                <strong><StatusBadge status="not_started" /></strong>
              </div>
              <div>
                <span>Programme</span>
                <strong>Not selected</strong>
              </div>
              <div>
                <span>Submitted</span>
                <strong>-</strong>
              </div>
            </div>
          </article>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <article className="applicant-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.65px", color: C.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
              Required Documents
            </div>
            {missing.map((item) => (
              <DocumentItem key={item} label={item} missing />
            ))}
            <div style={{ marginTop: 10, fontSize: 11.5, color: C.warningText, background: C.warningBg, borderRadius: 8, padding: "8px 10px" }}>
              0 of {snapshot.requiredDocuments} documents uploaded
            </div>
          </article>

          <article className="applicant-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>Need help?</div>
            <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.textSec, lineHeight: 1.6 }}>
              Contact admissions support for guidance on documents, programme choice, and payment.
            </p>
            <Link
              href="/applicant/help"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 38,
                borderRadius: 9,
                textDecoration: "none",
                border: `1.5px solid ${C.primary}`,
                color: C.primary,
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              Open Help Center
            </Link>
          </article>
        </aside>
      </section>
    </>
  );
}

function InProgressState({ snapshot }: { snapshot: DashboardSnapshot }) {
  const current = Math.min(Math.max(snapshot.currentStep, 1), 5);
  const missingSet = new Set(snapshot.missingDocuments);
  const docsComplete = snapshot.uploadedDocuments >= snapshot.requiredDocuments;
  const paymentUnderReview = snapshot.paymentStatus === "pending_approval";
  const paymentRejected = snapshot.paymentStatus === "failed";
  const paymentApproved = snapshot.paymentStatus === "successful";

  const stageLabel = paymentUnderReview
    ? "Under Review"
    : paymentApproved
      ? "Review"
      : docsComplete
        ? "Payment"
        : "Documents";

  const stageDescription = paymentUnderReview
    ? "Your receipt has been submitted for review. The admissions team will verify and update your payment status."
    : paymentApproved
      ? "Payment has been approved. Submit your application for admissions review."
      : docsComplete
        ? "All documents are uploaded. Submit your payment receipt below to move to review."
        : `Upload every required file to continue. Missing: ${snapshot.missingDocuments.length > 0 ? snapshot.missingDocuments.join(", ") : "None"}.`;

  const topStatus = paymentUnderReview
    ? "under_review"
    : paymentApproved
      ? "pending"
      : paymentRejected
        ? "rejected"
        : "incomplete";

  const ctaHref = !docsComplete
    ? "/applicant/documents"
    : paymentUnderReview || paymentApproved
      ? "/applicant/application/5"
      : "/applicant/application/4";

  const ctaLabel = !docsComplete
    ? "Continue Uploading"
    : paymentUnderReview || paymentApproved
      ? "Open Review"
      : "Open Payment Step";

  return (
    <>
      <Hero
        title={snapshot.name}
        subtitle={`Application in progress. You are currently on step ${current} of 5.`}
        right={<StatusBadge status={topStatus} />}
      />

      <StepRail current={current} />

      <section className="applicant-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: C.primary, color: C.white, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                {current}
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Current Step: {stageLabel}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {snapshot.uploadedDocuments} of {snapshot.requiredDocuments} uploaded
                </div>
              </div>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: C.textSec, lineHeight: 1.65 }}>
              {stageDescription}
            </p>
            <Link
              href={ctaHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 15px",
                borderRadius: 9,
                textDecoration: "none",
                color: C.white,
                background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {ctaLabel}
              <ChevronRight size={14} />
            </Link>
          </article>

          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.65px", color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>
              Application Snapshot
            </div>
            <div className="applicant-ledger">
              <div>
                <span>Programme</span>
                <strong>{snapshot.programmeLabel}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>
                  <StatusBadge
                    status={
                      paymentUnderReview
                        ? "under_review"
                        : paymentApproved
                          ? "pending"
                          : paymentRejected
                            ? "rejected"
                            : "incomplete"
                    }
                  />
                </strong>
              </div>
              <div>
                <span>Application ID</span>
                <strong style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>{snapshot.applicationPublicId}</strong>
              </div>
              <div>
                <span>Last Saved</span>
                <strong>{snapshot.lastSavedLabel}</strong>
              </div>
            </div>
          </article>

          {docsComplete && !paymentUnderReview && !paymentApproved ? (
            <PaymentActionPanel snapshot={snapshot} />
          ) : null}

          {snapshot.rejectionHistory.length > 0 ? (
            <article className="applicant-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.65px", color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>
                Application History
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {snapshot.rejectionHistory.map((row) => (
                  <div key={`${row.applicationPublicId}-${row.rejectedAt}`} style={{ border: `1px solid ${C.borderSubtle}`, borderRadius: 8, padding: "10px 12px", background: C.white }}>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{new Date(row.rejectedAt).toLocaleString("en-NG")}</div>
                    <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700, color: C.text }}>{row.applicationPublicId}</div>
                    <div style={{ marginTop: 2, fontSize: 12.5, color: C.textSec }}>{row.programmeLabel}</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, color: C.errorText, background: C.errorBg, borderRadius: 7, padding: "6px 8px" }}>
                      Rejection reason: {row.reason}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>

        <aside>
          <article className="applicant-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.65px", color: C.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
              Document Checklist
            </div>
            {REQUIRED_DOCUMENT_LABELS.map((doc) => (
              <DocumentItem key={doc} label={doc} missing={missingSet.has(doc)} />
            ))}
            <div style={{ marginTop: 10, fontSize: 11.5, color: C.infoText, background: C.infoBg, borderRadius: 8, padding: "8px 10px" }}>
              {snapshot.uploadedDocuments} of {snapshot.requiredDocuments} documents uploaded
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}

function RejectedState({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <>
      <Hero
        title={snapshot.name}
        subtitle="Your latest application was not approved. You can start a fresh application and correct the issues listed below."
        right={<StatusBadge status="rejected" />}
      />

      <section className="applicant-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>
              Latest Application Outcome
            </div>
            <div className="applicant-ledger">
              <div>
                <span>Application ID</span>
                <strong style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                  {snapshot.applicationPublicId}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>
                  <StatusBadge status="rejected" />
                </strong>
              </div>
              <div>
                <span>Programme</span>
                <strong>{snapshot.programmeLabel}</strong>
              </div>
              <div>
                <span>Last Updated</span>
                <strong>{snapshot.lastSavedLabel}</strong>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                color: C.errorText,
                background: C.errorBg,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 12.5,
              }}
            >
              Review the rejection reasons in your history and restart your submission.
            </div>

            <Link
              href="/applicant/dashboard?begin=1"
              style={{
                marginTop: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 15px",
                borderRadius: 9,
                textDecoration: "none",
                color: C.white,
                background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Start Fresh Application
              <ChevronRight size={14} />
            </Link>
          </article>

          {snapshot.rejectionHistory.length > 0 ? (
            <article className="applicant-card" style={{ padding: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.65px",
                  color: C.textMuted,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Rejection History
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {snapshot.rejectionHistory.map((row) => (
                  <div
                    key={`${row.applicationPublicId}-${row.rejectedAt}`}
                    style={{
                      border: `1px solid ${C.borderSubtle}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      background: C.white,
                    }}
                  >
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      {new Date(row.rejectedAt).toLocaleString("en-NG")}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700, color: C.text }}>
                      {row.applicationPublicId}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 12.5, color: C.textSec }}>
                      {row.programmeLabel}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12.5,
                        color: C.errorText,
                        background: C.errorBg,
                        borderRadius: 7,
                        padding: "6px 8px",
                      }}
                    >
                      Rejection reason: {row.reason}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <article className="applicant-card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.65px",
                color: C.textMuted,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Next Action
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.textSec, lineHeight: 1.6 }}>
              Prepare updated documents and personal details, then begin a new application from step 1.
            </p>
            <Link
              href="/applicant/help"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 38,
                borderRadius: 9,
                textDecoration: "none",
                border: `1.5px solid ${C.primary}`,
                color: C.primary,
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              Contact Support
            </Link>
          </article>
        </aside>
      </section>
    </>
  );
}

function ApprovedState({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <>
      <section
        style={{
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          background: `radial-gradient(circle at 88% 14%, rgba(196,154,38,0.22), transparent 30%), linear-gradient(145deg, #eaf8ea 0%, #d3efd3 58%, #edf8ed 100%)`,
          color: C.dark,
          padding: "22px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", opacity: 0.62, marginBottom: 7 }}>
            Congratulations
          </div>
          <h1 style={{ margin: 0, fontSize: 27, letterSpacing: "-0.4px", lineHeight: 1.08 }}>{snapshot.name}</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(26,58,26,0.76)", lineHeight: 1.65 }}>
            You have been admitted. Review your offer details and complete pre-resumption requirements.
          </p>
        </div>
        <span style={{ width: 52, height: 52, borderRadius: "50%", background: C.gold, color: C.white, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Award size={22} />
        </span>
      </section>

      <section className="applicant-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{snapshot.programmeLabel}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>TCoEFS · University of Jos · 2025/2026 Session</div>
              </div>
              <StatusBadge status="approved" />
            </div>
            <div className="applicant-ledger">
              <div>
                <span>Application ID</span>
                <strong style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>{snapshot.applicationPublicId}</strong>
              </div>
              <div>
                <span>Start Date</span>
                <strong>15 October 2025</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>3 Years (Full-time)</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Confirmed</strong>
              </div>
            </div>
          </article>

          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
              <Calendar size={15} color={C.primary} />
              Important Dates
            </div>
            {[
              { date: "15 Oct 2025", event: "Academic Session Begins", tone: C.primary },
              { date: "01 Oct 2025", event: "Registration Deadline", tone: C.warningText },
              { date: "20 Sep 2025", event: "Virtual Orientation", tone: C.infoText },
              { date: "01 Sep 2025", event: "Enrolment Fee Deadline", tone: C.errorText },
            ].map((row, index) => (
              <div key={row.date} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: index < 3 ? `1px solid ${C.borderSubtle}` : "none" }}>
                <span style={{ width: 84, fontSize: 12, fontWeight: 700, color: row.tone }}>{row.date}</span>
                <span style={{ fontSize: 13, color: C.textSec }}>{row.event}</span>
              </div>
            ))}
          </article>

          <article className="applicant-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 8 }}>Next Steps</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.textSec, lineHeight: 1.8 }}>
              <li>Accept your offer and confirm your admission profile.</li>
              <li>Pay enrolment tuition before the stated deadline.</li>
              <li>Complete online registration and document clearance.</li>
              <li>Attend virtual orientation on 20 September 2025.</li>
            </ol>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button style={{ border: "none", borderRadius: 9, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 12.5, fontWeight: 700, padding: "9px 13px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                View Enrolment Details
                <ExternalLink size={13} />
              </button>
              <button style={{ border: `1.5px solid ${C.gold}`, borderRadius: 9, background: C.goldWhisper, color: C.gold, fontSize: 12.5, fontWeight: 700, padding: "9px 13px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Download size={13} />
                Download Offer Letter
              </button>
            </div>
          </article>
        </div>

        <aside>
          <article className="applicant-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.65px", color: C.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
              Programme Coordinator
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Prof. Aisha Mohammed</div>
            <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>Department of Agricultural Science</div>
            <div style={{ marginTop: 8, fontSize: 12, color: C.primary }}>a.mohammed@tcoefs-unijos.org</div>
          </article>
        </aside>
      </section>
    </>
  );
}

export default function Page() {
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setIsLoading(true);
      setLoadError("");

      try {
        const begin = searchParams.get("begin") === "1";
        const programme = searchParams.get("programme");
        const params = new URLSearchParams();
        if (begin) params.set("ensureDraft", "1");
        if (programme) params.set("programme", programme);

        const url = `/api/applicant/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetch(url, { method: "GET" });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Could not load dashboard data.");
        }

        if (active) {
          setSnapshot(payload.data as DashboardSnapshot);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load dashboard data."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const ui = useMemo(() => {
    if (!snapshot) return null;
    if (snapshot.applicationState === "start") return <StartState snapshot={snapshot} />;
    if (snapshot.applicationState === "rejected") return <RejectedState snapshot={snapshot} />;
    if (snapshot.applicationState === "in_progress") return <InProgressState snapshot={snapshot} />;
    return <ApprovedState snapshot={snapshot} />;
  }, [snapshot]);

  if (isLoading) {
    return <PageLoading title="Preparing your applicant dashboard…" message="Loading your application status, document checklist, and next action." />;
  }

  if (loadError || !snapshot) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.canvas, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
        <div style={{ maxWidth: 480, border: `1px solid ${C.borderSubtle}`, borderRadius: 12, background: C.white, padding: "20px 22px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>Unable to load dashboard</div>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.65 }}>{loadError || "Please refresh and try again."}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: C.canvas, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
      <TopBar name={snapshot.name} open={menuOpen} onToggle={() => setMenuOpen((prev) => !prev)} />

      <div className="applicant-body" style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar activeItem="dashboard" open={menuOpen} />

        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "16px 18px 24px" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>{ui}</div>
        </main>
      </div>

      <style>{`
        .applicant-grid {
          display: grid;
          grid-template-columns: 1fr 292px;
          gap: 12px;
        }

        .applicant-card {
          border: 1px solid ${C.borderSubtle};
          border-radius: 12px;
          background: ${C.white};
          box-shadow: 0 10px 26px rgba(45, 90, 45, 0.08);
        }

        .applicant-ledger {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .applicant-ledger > div {
          border: 1px solid ${C.borderSubtle};
          border-radius: 10px;
          background: #fbfdfb;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .applicant-ledger > div > span {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.55px;
          text-transform: uppercase;
          color: ${C.textMuted};
        }

        .applicant-ledger > div > strong {
          font-size: 13px;
          color: ${C.text};
          font-weight: 700;
        }

        @media (max-width: 980px) {
          .applicant-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 920px) {
          .applicant-body {
            overflow: visible;
          }

          .applicant-ledger {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
