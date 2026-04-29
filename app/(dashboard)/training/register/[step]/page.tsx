"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Upload,
} from "lucide-react";
import {
  getTrainingStepCompletion,
  isTrainingStepOpen,
} from "@/features/training/progress";
import {
  buildTrainingStepHref,
  buildTrainingWorkspaceHref,
} from "@/features/training/routes";

type Snapshot = {
  name: string;
  initials: string;
  applicationId: string | null;
  programmeLabel: string;
  programmeSlug: string;
  programmeSelected: boolean;
  programmeFee: number | null;
  venue: string | null;
  schedule: string | null;
  personalDetailsComplete: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  documentsComplete: boolean;
  paymentStatus:
    | "pending"
    | "pending_receipt"
    | "pending_approval"
    | "successful"
    | "failed"
    | "none";
  paymentId: string | null;
  paymentAmount: number | null;
  receiptUploadedAt: string | null;
  adminNotes: string | null;
  currentStep: number;
  maxAllowedStep: number;
};

type ProgrammeOption = {
  id: string;
  title: string;
  slug: string;
  fees: number;
  schedule: string | null;
  venue: string | null;
};

type ChecklistItem = { id: string; label: string; completed: boolean };

type Payload = {
  snapshot: Snapshot;
  programmes: ProgrammeOption[];
  checklist: {
    items: ChecklistItem[];
    uploadedCount: number;
    requiredCount: number;
    complete: boolean;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    instructions?: string;
    amount: number;
  };
};

type ValidationIssue = { field: string; message: string };

const STEP_LABELS = ["Programme", "Profile", "Documents", "Payment", "Review"] as const;

function clampStep(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.trunc(value)));
}

function currency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPaymentStatus(status: Snapshot["paymentStatus"]) {
  if (status === "successful") return "Payment approved";
  if (status === "pending_approval") return "Receipt uploaded, awaiting review";
  if (status === "failed") return "Receipt rejected";
  if (status === "pending_receipt") return "Payment record created, receipt pending";
  return "Payment not started";
}

function paymentStatusTone(status: Snapshot["paymentStatus"]) {
  if (status === "successful") {
    return {
      fg: "var(--status-success-text)",
      bg: "var(--status-success-bg)",
    };
  }
  if (status === "failed") {
    return {
      fg: "var(--status-error-text)",
      bg: "var(--status-error-bg)",
    };
  }
  return {
    fg: "var(--status-warning-text)",
    bg: "var(--status-warning-bg)",
  };
}

function isAllowedUploadType(contentType: string) {
  return (
    contentType === "application/pdf" ||
    contentType === "image/jpeg" ||
    contentType === "image/png"
  );
}

function BankDetailsCard({
  details,
  amount,
}: {
  details: Payload["bankDetails"];
  amount: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAccountNumber() {
    try {
      await navigator.clipboard.writeText(details.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      style={{
        borderRadius: 14,
        background: "var(--bg-surface-light)",
        boxShadow: "var(--elevation-1)",
        padding: "16px 18px",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Building2 size={18} color="var(--green-primary)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          Bank Transfer Details
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bank</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {details.bankName}
        </span>

        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Account Number</span>
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", justifySelf: "end" }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: "var(--text-primary)",
            }}
          >
            {details.accountNumber}
          </span>
          <button
            type="button"
            onClick={copyAccountNumber}
            style={{
              border: "none",
              boxShadow: "var(--elevation-1)",
              background: "var(--bg-surface-default)",
              color: "var(--text-secondary)",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Copy account number"
            title={copied ? "Copied" : "Copy account number"}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Account Name</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>
          {details.accountName}
        </span>

        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Amount</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--green-primary)" }}>
          {currency(amount)}
        </span>
      </div>

      {details.instructions ? (
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {details.instructions}
        </p>
      ) : null}
    </div>
  );
}

export default function TrainingRegisterStepPage() {
  const router = useRouter();
  const params = useParams<{ step: string }>();
  const searchParams = useSearchParams();
  const step = useMemo(() => clampStep(Number.parseInt(params.step || "1", 10)), [params.step]);
  const requestedRegistrationId = (searchParams.get("registration") || "").trim() || null;

  const [payload, setPayload] = useState<Payload | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [documentChecks, setDocumentChecks] = useState<Record<string, boolean>>({});
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const snapshot = payload?.snapshot;
  const checklist = payload?.checklist;
  const bankDetails = payload?.bankDetails;
  const currentRegistrationId = snapshot?.applicationId || requestedRegistrationId;

  async function load() {
    const res = await fetch(
      `/api/training/application${requestedRegistrationId ? `?registration=${encodeURIComponent(requestedRegistrationId)}` : ""}`,
      { cache: "no-store" }
    );
    const body = await res.json();
    if (!res.ok || !body?.success) {
      throw new Error(body?.error || "Could not load training registration.");
    }

    const nextPayload = body.data as Payload;
    setPayload(nextPayload);
    setSelectedProgramme(nextPayload.snapshot.programmeSlug || "");
    setProfileForm({
      firstName: nextPayload.snapshot.firstName || "",
      lastName: nextPayload.snapshot.lastName || "",
      phone: nextPayload.snapshot.phone || "",
    });
    setDocumentChecks(
      Object.fromEntries(nextPayload.checklist.items.map((item) => [item.id, item.completed]))
    );

    if (step > nextPayload.snapshot.maxAllowedStep) {
      router.replace(
        buildTrainingStepHref(
          nextPayload.snapshot.maxAllowedStep,
          nextPayload.snapshot.applicationId
        )
      );
    }
  }

  useEffect(() => {
    void load().catch((error) => {
      setIssues([{ field: "load", message: error instanceof Error ? error.message : "Could not load training registration." }]);
    });
  }, [step]);

  const progress = useMemo(() => {
    if (!snapshot) return null;
    return {
      currentStep: snapshot.currentStep,
      maxAllowedStep: snapshot.maxAllowedStep,
      programmeDone: snapshot.programmeSelected,
      profileDone: snapshot.personalDetailsComplete,
      documentsDone: snapshot.documentsComplete,
      paymentReviewReady:
        snapshot.paymentStatus === "pending_approval" || snapshot.paymentStatus === "successful",
      paymentDone: snapshot.paymentStatus === "successful",
    };
  }, [snapshot]);

  async function saveProgrammeAndContinue() {
    if (!selectedProgramme) {
      setIssues([{ field: "programme", message: "Select a programme to continue." }]);
      return;
    }

    setIsBusy(true);
    setIssues([]);
    try {
      const res = await fetch("/api/training/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_programme", programmeSlug: selectedProgramme }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        setIssues(body?.issues || [{ field: "programme", message: body?.error || "Could not save programme." }]);
        return;
      }
      router.push(buildTrainingStepHref(2, body.data?.applicationId || null));
    } finally {
      setIsBusy(false);
    }
  }

  async function saveProfileAndContinue() {
    setIsBusy(true);
    setIssues([]);
    try {
      const res = await fetch("/api/training/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_profile",
          applicationId: currentRegistrationId,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        setIssues(body?.issues || [{ field: "profile", message: body?.error || "Could not save profile." }]);
        return;
      }
      await load();
      router.push(buildTrainingStepHref(3, currentRegistrationId));
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmDocumentsAndContinue() {
    const allChecked = checklist?.items.every((item) => documentChecks[item.id]);
    if (!allChecked) {
      setIssues([{ field: "documents", message: "Confirm all required items before continuing." }]);
      return;
    }

    setIsBusy(true);
    setIssues([]);
    try {
      const res = await fetch("/api/training/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_documents", applicationId: currentRegistrationId }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        setIssues(body?.issues || [{ field: "documents", message: body?.error || "Could not confirm documents." }]);
        return;
      }
      await load();
      router.push(buildTrainingStepHref(4, currentRegistrationId));
    } finally {
      setIsBusy(false);
    }
  }

  async function createOrGetPayment() {
    if (!snapshot || !bankDetails) throw new Error("Training data is still loading.");
    if (snapshot.paymentId) return snapshot.paymentId;

    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "training_application",
        entityId: snapshot.applicationId,
        amount: snapshot.programmeFee || bankDetails.amount,
      }),
    });

    const body = await res.json();
    if (!res.ok || !body?.success) {
      throw new Error(body?.error || "Unable to create payment record.");
    }

    const paymentId = body.data?.paymentId as string | undefined;
    if (!paymentId) throw new Error("Payment ID was not returned by the server.");
    return paymentId;
  }

  async function uploadReceipt(file: File) {
    if (!isAllowedUploadType(file.type)) {
      setIssues([{ field: "payment", message: "Accepted receipt formats are PDF, JPG, and PNG." }]);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setIssues([{ field: "payment", message: "Receipt size must not exceed 10MB." }]);
      return;
    }

    setUploadingReceipt(true);
    setIssues([]);
    try {
      const paymentId = await createOrGetPayment();
      const formData = new FormData();
      formData.set("paymentId", paymentId);
      formData.set("file", file);

      const res = await fetch("/api/payments/receipt", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Unable to upload receipt.");
      }
      await load();
      router.push(buildTrainingStepHref(5, currentRegistrationId));
    } catch (error) {
      setIssues([{ field: "payment", message: error instanceof Error ? error.message : "Unable to upload receipt." }]);
    } finally {
      setUploadingReceipt(false);
    }
  }

  if (!payload || !snapshot || !checklist || !bankDetails || !progress) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-surface-dark)", padding: "28px 20px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", color: "var(--text-secondary)" }}>
          Loading training registration...
        </div>
      </div>
    );
  }

  const amount = snapshot.programmeFee || bankDetails.amount || 0;
  const tone = paymentStatusTone(snapshot.paymentStatus);

  let content: React.ReactNode = null;

  if (step === 1) {
    content = (
      <div style={{ display: "grid", gap: 10 }}>
        {payload.programmes.map((item) => {
          const active = selectedProgramme === item.slug;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedProgramme(item.slug)}
              style={{
                textAlign: "left",
                border: active ? "1px solid var(--green-primary)" : "1px solid var(--border-subtle)",
                background: active ? "var(--green-whisper)" : "var(--bg-surface-default)",
                borderRadius: 12,
                padding: "14px 15px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--text-secondary)" }}>
                {currency(item.fees)}
                {item.schedule ? ` · ${item.schedule}` : ""}
                {item.venue ? ` · ${item.venue}` : ""}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (step === 2) {
    content = (
      <div className="training-form-grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>First name</span>
          <input
            value={profileForm.firstName}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
            style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px 13px", fontSize: 14, background: "var(--bg-surface-light)" }}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Last name</span>
          <input
            value={profileForm.lastName}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
            style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px 13px", fontSize: 14, background: "var(--bg-surface-light)" }}
          />
        </label>
        <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Phone number</span>
          <input
            value={profileForm.phone}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px 13px", fontSize: 14, background: "var(--bg-surface-light)" }}
            placeholder="e.g. +2348012345678"
          />
        </label>
      </div>
    );
  }

  if (step === 3) {
    content = (
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          Confirm that you have the required registration items ready. This step unlocks payment submission.
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {checklist.items.map((item) => (
            <label
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--bg-surface-light)",
                boxShadow: "var(--elevation-1)",
                borderRadius: 12,
                padding: "12px 13px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(documentChecks[item.id])}
                onChange={(e) =>
                  setDocumentChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))
                }
              />
              <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (step === 4) {
    content = (
      <div style={{ display: "grid", gap: 14 }}>
        <BankDetailsCard details={bankDetails} amount={amount} />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 999,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12,
            fontWeight: 700,
            width: "fit-content",
          }}
        >
          {formatPaymentStatus(snapshot.paymentStatus)}
        </div>
        <label
          style={{
            display: "grid",
            gap: 10,
            background: "var(--bg-surface-light)",
            boxShadow: "var(--elevation-1)",
            borderRadius: 14,
            padding: "16px 18px",
            cursor: uploadingReceipt ? "progress" : "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--text-primary)" }}>
            <Upload size={16} /> Upload transfer receipt
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB.
          </div>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadReceipt(file);
              e.currentTarget.value = "";
            }}
            disabled={uploadingReceipt}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {uploadingReceipt ? "Uploading receipt..." : "Tap to choose receipt file"}
          </span>
        </label>
        {snapshot.adminNotes ? (
          <div style={{ color: "var(--status-error-text)", fontSize: 13 }}>{snapshot.adminNotes}</div>
        ) : null}
      </div>
    );
  }

  if (step === 5) {
    content = (
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Registration review</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 12, padding: "12px 13px" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Programme</div>
            <div style={{ marginTop: 4, fontWeight: 700, color: "var(--text-primary)" }}>{snapshot.programmeLabel}</div>
          </div>
          <div style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 12, padding: "12px 13px" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Payment status</div>
            <div style={{ marginTop: 4, fontWeight: 700, color: tone.fg }}>{formatPaymentStatus(snapshot.paymentStatus)}</div>
          </div>
        </div>
        <div style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 14 }}>
          {snapshot.paymentStatus === "successful"
            ? "Your payment has been approved. You can now proceed to your training dashboard."
            : snapshot.paymentStatus === "pending_approval"
              ? "Your receipt has been submitted and is currently awaiting admin approval."
              : snapshot.paymentStatus === "failed"
                ? "Your receipt was rejected. Return to the payment step and upload a corrected receipt."
                : "Complete payment submission to move this registration into admin review."}
        </div>
        {snapshot.paymentStatus === "successful" ? (
          <Link
            href="/training/dashboard"
            style={{
              width: "fit-content",
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
            Open training portal
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="training-register-shell"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-surface-dark)",
        padding: "28px 20px",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Training Registration
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>
            Step {step} — {STEP_LABELS[step - 1]}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>
            {snapshot.programmeSelected
              ? `Programme: ${snapshot.programmeLabel}`
              : "Choose a training programme to continue registration."}
          </div>
        </div>

        <div style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 14, padding: "16px 20px" }}>
          <div className="training-register-steps" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 8 }}>
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const complete = getTrainingStepCompletion(n, progress);
              const open = isTrainingStepOpen(n, progress);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => open && router.push(buildTrainingStepHref(n, currentRegistrationId))}
                  disabled={!open}
                  style={{
                    borderRadius: 10,
                    border: "none",
                    boxShadow: active || complete ? "var(--elevation-1)" : "var(--shadow-inset)",
                    background: complete || active ? "var(--green-whisper)" : "var(--bg-surface-light)",
                    padding: "10px 8px",
                    textAlign: "center",
                    fontSize: 11,
                    color: complete || active ? "var(--green-primary)" : "var(--text-secondary)",
                    fontWeight: complete || active ? 700 : 500,
                    cursor: open ? "pointer" : "not-allowed",
                    opacity: open ? 1 : 0.6,
                  }}
                >
                  {String(n).padStart(2, "0")} · {label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>{content}</div>

          {issues.length > 0 ? (
            <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
              {issues.map((issue) => (
                <div key={`${issue.field}-${issue.message}`} style={{ color: "var(--status-error-text)", fontSize: 13 }}>
                  {issue.message}
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
            <button
              type="button"
              onClick={() => {
                if (step > 1) router.push(buildTrainingStepHref(step - 1, currentRegistrationId));
                else router.push(buildTrainingWorkspaceHref("/training/dashboard", currentRegistrationId));
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={14} /> Back
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={() => void saveProgrammeAndContinue()}
                disabled={isBusy || !selectedProgramme}
                style={{
                  border: "none",
                  background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                  color: "#fff",
                  borderRadius: 8,
                  boxShadow: "var(--elevation-1)",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: !selectedProgramme ? 0.6 : 1,
                  cursor: !selectedProgramme ? "not-allowed" : "pointer",
                }}
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : null}

            {step === 2 ? (
              <button
                type="button"
                onClick={() => void saveProfileAndContinue()}
                disabled={isBusy}
                style={{
                  border: "none",
                  background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                  color: "#fff",
                  borderRadius: 8,
                  boxShadow: "var(--elevation-1)",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : null}

            {step === 3 ? (
              <button
                type="button"
                onClick={() => void confirmDocumentsAndContinue()}
                disabled={isBusy}
                style={{
                  border: "none",
                  background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                  color: "#fff",
                  borderRadius: 8,
                  boxShadow: "var(--elevation-1)",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : null}

            {step === 4 ? (
              <button
                type="button"
                onClick={() => router.push(buildTrainingStepHref(snapshot.paymentStatus === "pending_approval" || snapshot.paymentStatus === "successful" ? 5 : 4, currentRegistrationId))}
                disabled={snapshot.paymentStatus !== "pending_approval" && snapshot.paymentStatus !== "successful"}
                style={{
                  border: "none",
                  background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                  color: "#fff",
                  borderRadius: 8,
                  boxShadow: "var(--elevation-1)",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  opacity:
                    snapshot.paymentStatus === "pending_approval" || snapshot.paymentStatus === "successful"
                      ? 1
                      : 0.6,
                  cursor:
                    snapshot.paymentStatus === "pending_approval" || snapshot.paymentStatus === "successful"
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : null}

            {step === 5 ? (
              <Link
                href={snapshot.paymentStatus === "successful" ? buildTrainingWorkspaceHref("/training/dashboard", currentRegistrationId) : snapshot.paymentStatus === "failed" ? buildTrainingStepHref(4, currentRegistrationId) : buildTrainingWorkspaceHref("/training/dashboard", currentRegistrationId)}
                style={{
                  textDecoration: "none",
                  background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                  color: "#fff",
                  borderRadius: 8,
                  boxShadow: "var(--elevation-1)",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {snapshot.paymentStatus === "successful" ? "Open portal" : snapshot.paymentStatus === "failed" ? "Return to payment" : "Open dashboard"} <ChevronRight size={14} />
              </Link>
            ) : null}
          </div>
        </div>

        <style>{`
          @media (max-width: 920px) {
            .training-register-shell {
              padding: 20px 14px 32px !important;
            }
            .training-register-steps {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .training-form-grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
