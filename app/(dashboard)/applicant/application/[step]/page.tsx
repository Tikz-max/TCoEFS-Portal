"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Upload,
} from "lucide-react";
import type { DocumentType } from "@/types/database.types";
import {
  getApplicationProgress,
  getStepCompletion,
  isStepOpen,
} from "@/features/applications/progress";

type Snapshot = {
  name: string;
  applicationPublicId: string;
  applicationId: string | null;
  programmeLabel: string;
  programmeSlug: string;
  programmeSelected: boolean;
  uploadedDocuments: number;
  requiredDocuments: number;
  personalDetailsComplete: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  personalStatement: string;
  paymentStatus:
    | "pending"
    | "pending_receipt"
    | "pending_approval"
    | "successful"
    | "failed"
    | "none";
  paymentId: string | null;
  paymentRrr: string | null;
  paymentAmount: number | null;
  receiptUploadedAt: string | null;
};

type ProgrammeOption = {
  slug: string;
  label: string;
};

type ValidationIssue = {
  field: string;
  message: string;
};

type ChecklistItem = {
  type: DocumentType;
  label: string;
  uploaded: boolean;
  filePath: string | null;
};

type Checklist = {
  items: ChecklistItem[];
  uploadedCount: number;
  requiredCount: number;
  complete: boolean;
};

type AppPayload = {
  snapshot: Snapshot;
  programmes: ProgrammeOption[];
  checklist: Checklist;
};

type BankDetails = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  instructions?: string;
  amount: number;
};

const STEP_LABELS = [
  "Programme",
  "Personal",
  "Documents",
  "Payment",
  "Review",
] as const;

const APPLICATION_FEE = 25000;

const FALLBACK_BANK_DETAILS: BankDetails = {
  bankName: "Access Bank PLC",
  accountNumber: "1886573891",
  accountName: "University of Jos External Funded Account",
  amount: APPLICATION_FEE,
  instructions:
    "Transfer the exact amount and keep your teller or transfer receipt for upload.",
};

let initialApplicationLoad: Promise<AppPayload> | null = null;
let initialBankDetailsLoad: Promise<BankDetails> | null = null;

function clampStep(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.trunc(value)));
}

function validatePersonal(input: {
  firstName: string;
  lastName: string;
  phone: string;
  personalStatement: string;
}) {
  const issues: ValidationIssue[] = [];
  const phonePattern = /^\+?[0-9]{10,15}$/;
  if (input.firstName.trim().length < 2) {
    issues.push({
      field: "firstName",
      message: "First name must be at least 2 characters.",
    });
  }
  if (input.lastName.trim().length < 2) {
    issues.push({
      field: "lastName",
      message: "Last name must be at least 2 characters.",
    });
  }
  if (!phonePattern.test(input.phone.trim())) {
    issues.push({ field: "phone", message: "Enter a valid phone number." });
  }
  if (input.personalStatement.trim().length < 20) {
    issues.push({
      field: "personalStatement",
      message: "Personal statement must be at least 20 characters.",
    });
  }
  return issues;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatStatusLabel(status: Snapshot["paymentStatus"]) {
  if (status === "successful") return "Payment Approved";
  if (status === "pending_approval") return "Receipt Uploaded, Pending Review";
  if (status === "failed") return "Payment Rejected";
  if (status === "pending" || status === "pending_receipt" || status === "none") {
    return "Awaiting Payment";
  }
  return "Awaiting Payment";
}

function statusTone(status: Snapshot["paymentStatus"]) {
  if (status === "successful") {
    return {
      fg: "var(--status-success-text)",
      bg: "var(--status-success-bg)",
      border: "var(--green-light)",
    };
  }

  if (status === "failed") {
    return {
      fg: "var(--status-error-text)",
      bg: "var(--status-error-bg)",
      border: "var(--status-error-border, #FCA5A5)",
    };
  }

  return {
    fg: "var(--status-warning-text)",
    bg: "var(--status-warning-bg)",
    border: "var(--status-warning-border, #FDE68A)",
  };
}

function isAllowedUploadType(contentType: string) {
  return (
    contentType === "application/pdf" ||
    contentType === "image/jpeg" ||
    contentType === "image/png"
  );
}

function BankDetailsCard({ details }: { details: BankDetails }) {
  const [copied, setCopied] = useState(false);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(details.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border-subtle)",
        padding: "16px 18px",
        background: "linear-gradient(180deg, #F5FAF5 0%, var(--green-whisper) 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Building2 size={18} color="var(--green-primary)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          Bank Transfer Details
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bank</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {details.bankName}
        </span>

        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Account Number</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifySelf: "end" }}>
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.4px",
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "var(--font-geist-mono, monospace)",
              lineHeight: 1,
            }}
          >
            {details.accountNumber}
          </span>
          <button
            type="button"
            onClick={copyAccountNumber}
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface-default)",
              color: "var(--text-secondary)",
              borderRadius: 6,
              width: 30,
              height: 30,
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
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "right",
            maxWidth: 420,
          }}
        >
          {details.accountName}
        </span>

        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Amount</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--green-primary)" }}>
          {currency(details.amount)}
        </span>
      </div>

      {details.instructions ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {details.instructions}
        </p>
      ) : null}
    </div>
  );
}

export default function ApplicantApplicationStepPage() {
  const router = useRouter();
  const params = useParams<{ step: string }>();
  const step = useMemo(
    () => clampStep(Number.parseInt(params.step || "1", 10)),
    [params.step]
  );

  const [payload, setPayload] = useState<AppPayload | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails>(FALLBACK_BANK_DETAILS);
  const [isBusy, setIsBusy] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null);
  const [uploadingDocumentType, setUploadingDocumentType] =
    useState<DocumentType | null>(null);

  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [personalStatement, setPersonalStatement] = useState("");
  const documentInputRefs = useRef<
    Partial<Record<DocumentType, HTMLInputElement | null>>
  >({});
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const progress = useMemo(() => {
    if (!payload) return null;
    return getApplicationProgress({
      programmeSelected: payload.snapshot.programmeSelected,
      personalDetailsComplete: payload.snapshot.personalDetailsComplete,
      documentsComplete: payload.checklist.complete,
      paymentStatus: payload.snapshot.paymentStatus,
    });
  }, [payload]);

  async function requestBankDetails(): Promise<BankDetails> {
    try {
      const res = await fetch("/api/payments/bank-details", { method: "GET" });
      const body = await res.json();
      if (!res.ok || !body?.success || !body?.data) {
        return bankDetails;
      }

      const nextBankDetails = {
        bankName: body.data.bankName || FALLBACK_BANK_DETAILS.bankName,
        accountNumber:
          body.data.accountNumber || FALLBACK_BANK_DETAILS.accountNumber,
        accountName: body.data.accountName || FALLBACK_BANK_DETAILS.accountName,
        amount: Number(body.data.amount || APPLICATION_FEE),
        instructions:
          body.data.instructions || FALLBACK_BANK_DETAILS.instructions,
      };
      setBankDetails(nextBankDetails);
      return nextBankDetails;
    } catch {
      // Keep fallback values.
      return bankDetails;
    }
  }

  async function getBankDetails(initial = false) {
    if (!initial) {
      return requestBankDetails();
    }

    if (!initialBankDetailsLoad) {
      initialBankDetailsLoad = requestBankDetails().finally(() => {
        initialBankDetailsLoad = null;
      });
    }

    return initialBankDetailsLoad;
  }

  async function requestApplicationLoad(): Promise<AppPayload> {
    setLoadError("");
    const res = await fetch("/api/applicant/application", { method: "GET" });
    const body = await res.json();
    if (!res.ok || !body?.success) {
      throw new Error(body?.error || "Could not load application flow.");
    }

    const nextPayload = body.data as AppPayload;
    setPayload(nextPayload);
    setSelectedProgramme(
      nextPayload.snapshot.programmeSelected ? nextPayload.snapshot.programmeSlug : ""
    );
    setFirstName(nextPayload.snapshot.firstName || "");
    setLastName(nextPayload.snapshot.lastName || "");
    setPhone(nextPayload.snapshot.phone || "");
    setPersonalStatement(nextPayload.snapshot.personalStatement || "");
    return nextPayload;
  }

  async function load(initial = false) {
    if (!initial) {
      return requestApplicationLoad();
    }

    if (!initialApplicationLoad) {
      initialApplicationLoad = requestApplicationLoad().finally(() => {
        initialApplicationLoad = null;
      });
    }

    return initialApplicationLoad;
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Promise.all([load(true), getBankDetails(true)]);
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load application flow."
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const maxAllowedStep = useMemo(() => {
    return progress?.maxAllowedStep || 1;
  }, [progress]);

  useEffect(() => {
    if (!payload) return;
    if (step > maxAllowedStep) {
      router.replace(`/applicant/application/${maxAllowedStep}`);
    }
  }, [payload, step, maxAllowedStep, router]);

  if (loadError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-surface-dark)",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 620,
            borderRadius: 12,
            padding: 20,
            background: "var(--bg-surface-default)",
            boxShadow: "var(--elevation-2)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Unable to load application flow
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-surface-dark)",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1120,
            borderRadius: 12,
            padding: 20,
            background: "var(--bg-surface-default)",
            boxShadow: "var(--elevation-2)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          Loading application details...
        </div>
      </div>
    );
  }

  const { snapshot, programmes, checklist } = payload;
  const programmeDone = progress?.programmeDone || false;
  const personalDone = progress?.personalDone || false;
  const documentsDone = progress?.documentsDone || false;
  const paymentDone = progress?.paymentDone || false;

  if (step > maxAllowedStep) {
    return null;
  }

  const paymentTone = statusTone(snapshot.paymentStatus);
  const paymentStatusLabel = formatStatusLabel(snapshot.paymentStatus);
  const paymentPendingReview = snapshot.paymentStatus === "pending_approval";
  const paymentFailed = snapshot.paymentStatus === "failed";

  function canOpenStep(target: number) {
    return progress ? isStepOpen(target, progress) : target <= 1;
  }

  function goToStep(target: number) {
    if (!canOpenStep(target)) return;
    router.push(`/applicant/application/${target}`);
  }

  async function apiAction(action: Record<string, unknown>) {
    const res = await fetch("/api/applicant/application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const body = await res.json();
    return { res, body };
  }

  async function saveProgrammeAndContinue() {
    if (!selectedProgramme) {
      setIssues([{ field: "programme", message: "Please select a programme." }]);
      return;
    }

    setIsBusy(true);
    setIssues([]);
    try {
      const { res, body } = await apiAction({
        action: "select_programme",
        programmeSlug: selectedProgramme,
      });
      if (!res.ok || !body?.success) {
        setIssues([
          ...(body?.issues || [
            { field: "programme", message: body?.error || "Unable to save programme." },
          ]),
        ]);
        return;
      }
      setPayload((prev) => {
        if (!prev) return prev;
        const selected = prev.programmes.find((item) => item.slug === selectedProgramme);
        return {
          ...prev,
          snapshot: {
            ...prev.snapshot,
            programmeSelected: true,
            programmeSlug: selectedProgramme,
            programmeLabel: selected?.label || prev.snapshot.programmeLabel,
          },
        };
      });
      router.push("/applicant/application/2");
      void load();
    } finally {
      setIsBusy(false);
    }
  }

  async function savePersonalAndContinue() {
    const localIssues = validatePersonal({
      firstName,
      lastName,
      phone,
      personalStatement,
    });
    if (localIssues.length > 0) {
      setIssues(localIssues);
      return;
    }

    setIsBusy(true);
    setIssues([]);
    try {
      const { res, body } = await apiAction({
        action: "save_personal",
        firstName,
        lastName,
        phone,
        personalStatement,
      });
      if (!res.ok || !body?.success) {
        setIssues([
          ...(body?.issues || [
            {
              field: "personal",
              message: body?.error || "Unable to save details.",
            },
          ]),
        ]);
        return;
      }
      setPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          snapshot: {
            ...prev.snapshot,
            personalDetailsComplete: true,
            firstName,
            lastName,
            phone,
            personalStatement,
          },
        };
      });
      router.push("/applicant/application/3");
      void load();
    } finally {
      setIsBusy(false);
    }
  }

  async function uploadDocumentForType(documentType: DocumentType, file: File) {
    if (!isAllowedUploadType(file.type)) {
      setIssues([
        {
          field: "documents",
          message: "Accepted document formats are PDF, JPG, and PNG.",
        },
      ]);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setIssues([
        {
          field: "documents",
          message: "Document file size must not exceed 10MB.",
        },
      ]);
      return;
    }

    setUploadingDocumentType(documentType);
    setIssues([]);

    try {
      const formData = new FormData();
      formData.set("documentType", documentType);
      formData.set("file", file);

      const res = await fetch("/api/applicant/documents/upload", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let body: any = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
      }

      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Unable to upload document right now.");
      }

      const filePath = body.data?.filePath as string | undefined;
      if (!filePath) {
        throw new Error("Upload completed but file key was not returned.");
      }

      setPayload((prev) => {
        if (!prev) return prev;
        const nextItems = prev.checklist.items.map((item) =>
          item.type === documentType
            ? {
                ...item,
                uploaded: true,
                filePath,
              }
            : item
        );
        const uploadedCount = nextItems.filter((item) => item.uploaded).length;
        return {
          ...prev,
          checklist: {
            ...prev.checklist,
            items: nextItems,
            uploadedCount,
            complete: uploadedCount >= prev.checklist.requiredCount,
          },
          snapshot: {
            ...prev.snapshot,
            uploadedDocuments: uploadedCount,
          },
        };
      });
      void load();
    } catch (error) {
      setIssues([
        {
          field: "documents",
          message:
            error instanceof Error
              ? error.message
              : "Unable to upload document right now.",
        },
      ]);
    } finally {
      setUploadingDocumentType(null);
    }
  }

  async function createOrGetPayment() {
    if (snapshot.paymentId) return snapshot.paymentId;

    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "application",
        entityId: snapshot.applicationId,
        amount: snapshot.paymentAmount || bankDetails.amount || APPLICATION_FEE,
      }),
    });

    const body = await res.json();
    if (!res.ok || !body?.success) {
      throw new Error(body?.error || "Unable to create payment record.");
    }

    const paymentId = body.data?.paymentId as string | undefined;
    if (!paymentId) {
      throw new Error("Payment ID was not returned by the server.");
    }
    return paymentId;
  }

  async function handleReceiptUpload() {
    if (!selectedReceipt) {
      setIssues([
        {
          field: "payment",
          message: "Select a receipt file before submitting.",
        },
      ]);
      return;
    }

    if (!isAllowedUploadType(selectedReceipt.type)) {
      setIssues([
        {
          field: "payment",
          message: "Accepted receipt formats are PDF, JPG, and PNG.",
        },
      ]);
      return;
    }

    if (selectedReceipt.size > 10 * 1024 * 1024) {
      setIssues([
        {
          field: "payment",
          message: "Receipt file size must not exceed 10MB.",
        },
      ]);
      return;
    }

    setUploadingReceipt(true);
    setIssues([]);

    try {
      const paymentId = await createOrGetPayment();
      const formData = new FormData();
      formData.set("paymentId", paymentId);
      formData.set("file", selectedReceipt);

      const confirmRes = await fetch("/api/payments/receipt", {
        method: "POST",
        body: formData,
      });
      const confirmBody = await confirmRes.json();
      if (!confirmRes.ok || !confirmBody?.success) {
        throw new Error(confirmBody?.error || "Unable to submit payment receipt.");
      }

      const receiptUploadedAt =
        (confirmBody.data?.receiptUploadedAt as string | undefined) ||
        new Date().toISOString();
      setPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          snapshot: {
            ...prev.snapshot,
            paymentStatus: "pending_approval",
            receiptUploadedAt,
          },
        };
      });
      setSelectedReceipt(null);
      router.push("/applicant/application/5");
      void load();
    } catch (error) {
      setIssues([
        {
          field: "payment",
          message:
            error instanceof Error
              ? error.message
              : "Unable to upload receipt right now.",
        },
      ]);
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function submitForReview() {
    setIsBusy(true);
    setIssues([]);
    try {
      const { res, body } = await apiAction({ action: "submit_review" });
      if (!res.ok || !body?.success) {
        setIssues([
          ...(body?.issues || [
            {
              field: "review",
              message: body?.error || "Unable to submit for review.",
            },
          ]),
        ]);
        return;
      }
      router.push("/applicant/dashboard");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div
      className="applicant-flow-root"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-surface-dark)",
        padding: "24px 18px 40px",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      }}
    >
      <div
        className="applicant-flow-shell"
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "var(--bg-surface-default)",
            borderRadius: 12,
            boxShadow: "var(--elevation-2)",
            padding: 20,
          }}
        >
          <div
            className="applicant-flow-summary"
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Application Workflow
          </div>
          <div
            className="applicant-flow-steps"
            style={{
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "var(--text-primary)",
              letterSpacing: "-0.4px",
            }}
          >
            Step {step} — {STEP_LABELS[step - 1]}
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-surface-default)",
            borderRadius: 12,
            boxShadow: "var(--elevation-2)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Applicant
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {snapshot.name}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Application ID
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
              >
                {snapshot.applicationPublicId}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Programme
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {snapshot.programmeSelected ? snapshot.programmeLabel : "Not selected"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Documents
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {checklist.uploadedCount}/{checklist.requiredCount} uploaded
          </div>
        </div>
        <style>{`
          .applicant-flow-root {
            background:
              radial-gradient(circle at 12% 0%, rgba(168, 212, 168, 0.22), transparent 30%),
              var(--bg-surface-dark) !important;
          }

          .applicant-flow-shell > div {
            border: 1px solid var(--border-subtle);
            border-radius: 14px !important;
            box-shadow: 0 12px 28px rgba(45, 90, 45, 0.09) !important;
            background: var(--bg-surface-default) !important;
          }

          .applicant-flow-shell > div:first-child {
            border-color: rgba(255, 255, 255, 0.12);
            background:
              radial-gradient(circle at 85% 18%, rgba(168, 212, 168, 0.2), transparent 28%),
              linear-gradient(145deg, var(--green-dark) 0%, var(--green-darkest) 60%, #1f3e1f 100%) !important;
            box-shadow: 0 18px 40px rgba(20, 40, 20, 0.2) !important;
          }

          .applicant-flow-shell > div:first-child .applicant-flow-summary {
            color: rgba(255, 255, 255, 0.62) !important;
            letter-spacing: 0.85px;
          }

          .applicant-flow-shell > div:first-child .applicant-flow-steps {
            color: rgba(255, 255, 255, 0.95) !important;
            letter-spacing: -0.6px;
            line-height: 1.08;
          }

          @media (max-width: 920px) {
            .applicant-flow-root {
              padding: 18px 12px 32px !important;
            }
            .applicant-flow-shell {
              max-width: none !important;
            }
            .applicant-flow-shell > div {
              padding: 18px !important;
            }
            .applicant-flow-shell h1,
            .applicant-flow-shell [style*="font-size: 30px"] {
              font-size: 25px !important;
            }
            .applicant-flow-summary {
              grid-template-columns: 1fr !important;
            }
            .applicant-flow-steps {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
        `}</style>
      </div>
    </div>

        <div
          style={{
            background: "var(--bg-surface-default)",
            borderRadius: 12,
            boxShadow: "var(--elevation-2)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${STEP_LABELS.length}, minmax(0,1fr))`,
              gap: 10,
              marginBottom: 18,
            }}
          >
            {STEP_LABELS.map((label, idx) => {
              const index = idx + 1;
              const complete = progress ? getStepCompletion(index, progress) : false;
              const active = index === step;
              const enabled = canOpenStep(index);
              return (
                <button
                  key={label}
                  onClick={() => goToStep(index)}
                  disabled={!enabled}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${active ? "var(--green-primary)" : "var(--border-subtle)"}`,
                    background: active
                      ? "var(--green-whisper)"
                      : "var(--bg-surface-default)",
                    minHeight: 58,
                    cursor: enabled ? "pointer" : "not-allowed",
                    opacity: enabled ? 1 : 0.55,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4,
                    boxShadow: active ? "var(--elevation-1)" : "none",
                  }}
                >
                  <div style={{ minHeight: 16 }}>
                    {complete ? (
                      <CheckCircle2 size={14} color="var(--status-success-text)" />
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          color: active
                            ? "var(--green-primary)"
                            : "var(--text-muted)",
                          fontWeight: 700,
                        }}
                      >
                        {String(index).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: active
                        ? "var(--green-primary)"
                        : "var(--text-secondary)",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                  gap: 10,
                }}
              >
                {programmes.map((programme) => {
                  const active = selectedProgramme === programme.slug;
                  return (
                    <button
                      key={programme.slug}
                      onClick={() => setSelectedProgramme(programme.slug)}
                      style={{
                        minHeight: 64,
                        borderRadius: 10,
                        border: `1px solid ${active ? "var(--green-primary)" : "var(--border-subtle)"}`,
                        background: active
                          ? "var(--green-whisper)"
                          : "var(--bg-surface-default)",
                        color: "var(--text-primary)",
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        boxShadow: active ? "var(--elevation-1)" : "none",
                      }}
                    >
                      {programme.label}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <a
                  href="/applicant/dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    textDecoration: "none",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <ChevronLeft size={14} /> Back
                </a>
                <button
                  onClick={saveProgrammeAndContinue}
                  disabled={isBusy}
                  style={{
                    height: 38,
                    borderRadius: 8,
                    border: "none",
                    padding: "0 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background:
                      "linear-gradient(135deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isBusy ? "not-allowed" : "pointer",
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  {isBusy ? "Saving..." : "Save and Continue"} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    height: 42,
                    borderRadius: 8,
                    border: "1px solid var(--border-default)",
                    padding: "0 12px",
                    fontSize: 14,
                    color: "var(--text-primary)",
                  }}
                />
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    height: 42,
                    borderRadius: 8,
                    border: "1px solid var(--border-default)",
                    padding: "0 12px",
                    fontSize: 14,
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <input
                placeholder="Phone (+234...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  height: 42,
                  borderRadius: 8,
                  border: "1px solid var(--border-default)",
                  padding: "0 12px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                }}
              />
              <textarea
                placeholder="Why do you want this programme? Example: I want to build stronger skills in food processing and research to support my career goals. (minimum 20 characters)"
                value={personalStatement}
                onChange={(e) => setPersonalStatement(e.target.value)}
                style={{
                  minHeight: 120,
                  borderRadius: 8,
                  border: "1px solid var(--border-default)",
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => router.push("/applicant/application/1")}
                  style={{
                    background: "none",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={savePersonalAndContinue}
                  disabled={isBusy}
                  style={{
                    height: 38,
                    borderRadius: 8,
                    border: "none",
                    padding: "0 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background:
                      "linear-gradient(135deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isBusy ? "not-allowed" : "pointer",
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  {isBusy ? "Saving..." : "Save and Continue"} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gap: 8 }}>
                {checklist.items.map((item) => (
                  <div
                    key={item.type}
                    style={{
                      borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => documentInputRefs.current[item.type]?.click()}
                        disabled={Boolean(uploadingDocumentType)}
                        style={{
                          height: 32,
                          borderRadius: 7,
                          border: "1px solid var(--border-default)",
                          background: "var(--bg-surface-default)",
                          color: "var(--text-primary)",
                          padding: "0 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: uploadingDocumentType ? "not-allowed" : "pointer",
                          opacity: uploadingDocumentType ? 0.6 : 1,
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Upload size={13} />
                        {uploadingDocumentType === item.type ? "Uploading..." : item.uploaded ? "Replace" : "Upload"}
                      </button>

                      <input
                        ref={(node) => {
                          documentInputRefs.current[item.type] = node;
                        }}
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          void uploadDocumentForType(item.type, file);
                        }}
                        style={{ display: "none" }}
                      />

                      <div
                        style={{
                          fontSize: 12,
                          color: item.uploaded
                            ? "var(--status-success-text)"
                            : "var(--status-warning-text)",
                          background: item.uploaded
                            ? "var(--status-success-bg)"
                            : "var(--status-warning-bg)",
                          borderRadius: 999,
                          padding: "3px 8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.uploaded ? "Uploaded" : "Missing"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => router.push("/applicant/application/2")}
                  style={{
                    background: "none",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={() => goToStep(4)}
                  disabled={!documentsDone}
                  style={{
                    height: 38,
                    borderRadius: 8,
                    border: "none",
                    padding: "0 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background:
                      "linear-gradient(135deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: documentsDone ? "pointer" : "not-allowed",
                    opacity: documentsDone ? 1 : 0.6,
                  }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <BankDetailsCard
                details={{
                  ...bankDetails,
                  amount: snapshot.paymentAmount || bankDetails.amount || APPLICATION_FEE,
                }}
              />

              <div
                style={{
                  borderRadius: 10,
                  border: `1px solid ${paymentTone.border}`,
                  background: paymentTone.bg,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      color: paymentTone.fg,
                      fontWeight: 700,
                    }}
                  >
                    Payment Status
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: paymentTone.fg,
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    {paymentStatusLabel}
                  </div>
                </div>

                {snapshot.receiptUploadedAt ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: paymentTone.fg,
                      opacity: 0.9,
                      textAlign: "right",
                    }}
                  >
                    Receipt submitted
                    <br />
                    {new Date(snapshot.receiptUploadedAt).toLocaleString("en-NG")}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  borderRadius: 10,
                  border: "1px dashed var(--border-default)",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Upload payment receipt (PDF, JPG, PNG, max 10MB)
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => receiptInputRef.current?.click()}
                    disabled={uploadingReceipt}
                    style={{
                      height: 38,
                      borderRadius: 8,
                      border: "1px solid var(--border-default)",
                      background: "var(--bg-surface-default)",
                      color: "var(--text-primary)",
                      padding: "0 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: uploadingReceipt ? "not-allowed" : "pointer",
                      opacity: uploadingReceipt ? 0.7 : 1,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <Upload size={14} /> Upload Receipt
                  </button>

                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedReceipt(file);
                      e.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />

                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {selectedReceipt ? selectedReceipt.name : "No file selected"}
                  </span>
                </div>

                <button
                  onClick={handleReceiptUpload}
                  disabled={uploadingReceipt}
                  style={{
                    alignSelf: "flex-start",
                    height: 38,
                    borderRadius: 8,
                    border: "none",
                    padding: "0 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--green-primary)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: uploadingReceipt ? "not-allowed" : "pointer",
                    opacity: uploadingReceipt ? 0.7 : 1,
                  }}
                >
                  {uploadingReceipt ? "Uploading..." : "I've Made the Transfer"}
                </button>
              </div>

              {snapshot.paymentStatus === "pending_approval" ? (
                <div
                  style={{
                    borderRadius: 8,
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface-dark)",
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  Your receipt has been submitted for review. The admissions team will
                  verify and update your payment status.
                </div>
              ) : null}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => router.push("/applicant/application/3")}
                  style={{
                    background: "none",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={() => goToStep(5)}
                  disabled={
                    snapshot.paymentStatus !== "successful" &&
                    snapshot.paymentStatus !== "pending_approval"
                  }
                  style={{
                    height: 38,
                    borderRadius: 8,
                    border: "none",
                    padding: "0 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background:
                      "linear-gradient(135deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      snapshot.paymentStatus === "successful" ||
                      snapshot.paymentStatus === "pending_approval"
                        ? "pointer"
                        : "not-allowed",
                    opacity:
                      snapshot.paymentStatus === "successful" ||
                      snapshot.paymentStatus === "pending_approval"
                        ? 1
                        : 0.6,
                  }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  borderRadius: 10,
                  border: `1px solid ${paymentTone.border}`,
                  background: paymentTone.bg,
                  padding: "12px 14px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: paymentTone.fg,
                  fontWeight: 600,
                }}
              >
                {paymentPendingReview
                  ? "Your receipt has been submitted for review. The admissions team will verify and update your payment status."
                  : paymentFailed
                    ? "Your previous receipt was rejected. Return to Payment to upload a new receipt."
                    : "Payment is approved. Submit your application for admissions review."}
              </div>

              {snapshot.paymentStatus === "successful" ? (
                <button
                  onClick={submitForReview}
                  disabled={isBusy}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    border: "none",
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background:
                      "linear-gradient(135deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: isBusy ? "not-allowed" : "pointer",
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  Submit for Review <ChevronRight size={14} />
                </button>
              ) : null}

              <button
                onClick={() => router.push("/applicant/dashboard")}
                style={{
                  height: 52,
                  borderRadius: 12,
                  border: "none",
                  padding: "0 20px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background:
                    "linear-gradient(135deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  width: "100%",
                  boxShadow: "var(--elevation-2)",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {issues.length > 0 && (
            <div
              style={{
                marginTop: 12,
                color: "var(--status-error-text)",
                background: "var(--status-error-bg)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {issues.map((issue) => (
                <div key={`${issue.field}-${issue.message}`}>{issue.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
