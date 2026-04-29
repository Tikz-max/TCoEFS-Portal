"use client";

import { useState } from "react";
import { Building2, Check, Copy, Eye, FileText } from "lucide-react";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function CopyValueButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`card-reference__copy-btn${copied ? " card-reference__copy-btn--copied" : ""}`}
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <>
          <Check size={13} /> Copied
        </>
      ) : (
        <>
          <Copy size={13} /> Copy
        </>
      )}
    </button>
  );
}

export interface BankTransferDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  programmeName?: string;
  instructions?: string;
}

export function BankTransferCard({ details }: { details: BankTransferDetails }) {
  return (
    <div className="card-reference" role="region" aria-label="Bank transfer details">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Building2 size={18} color="var(--green-primary)" aria-hidden="true" />
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          Manual Bank Transfer
        </div>
      </div>

      <div className="card-reference__details">
        <div className="card-reference__detail-row">
          <span className="card-reference__detail-key">Bank</span>
          <span className="card-reference__detail-value">{details.bankName}</span>
        </div>

        <div className="card-reference__detail-row">
          <span className="card-reference__detail-key">Account Number</span>
          <span className="card-reference__detail-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
              {details.accountNumber}
            </span>
            <CopyValueButton value={details.accountNumber} />
          </span>
        </div>

        <div className="card-reference__detail-row">
          <span className="card-reference__detail-key">Account Name</span>
          <span className="card-reference__detail-value">{details.accountName}</span>
        </div>

        {details.programmeName ? (
          <div className="card-reference__detail-row">
            <span className="card-reference__detail-key">Programme</span>
            <span className="card-reference__detail-value">{details.programmeName}</span>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingTop: "var(--space-3)",
            marginTop: "var(--space-1)",
            borderTop: "2px solid var(--border-default)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            Amount
          </span>
          <span className="card-reference__amount">{formatNaira(details.amount)}</span>
        </div>
      </div>

      {details.instructions ? (
        <div
          style={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface-dark)",
            padding: "var(--space-3)",
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          {details.instructions}
        </div>
      ) : null}
    </div>
  );
}

export interface AdminPaymentDetails {
  reference: string;
  applicantName: string;
  programmeName: string;
  amountNaira: number;
  statusLabel: string;
  statusTone?: "success" | "warning" | "danger" | "info";
  receiptFilename?: string;
  onViewReceipt?: () => void;
}

export function AdminPaymentCard({ details }: { details: AdminPaymentDetails }) {
  const toneStyles =
    details.statusTone === "success"
      ? { bg: "var(--status-success-bg)", color: "var(--status-success-text)" }
      : details.statusTone === "danger"
        ? { bg: "var(--status-error-bg)", color: "var(--status-error-text)" }
        : details.statusTone === "info"
          ? { bg: "#DBEAFE", color: "#1E40AF" }
          : { bg: "var(--status-warning-bg)", color: "var(--status-warning-text)" };

  return (
    <div className="card" style={{ display: "grid", gap: "var(--space-3)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Reference</div>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>
            {details.reference}
          </div>
        </div>
        <div
          style={{
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            background: toneStyles.bg,
            color: toneStyles.color,
          }}
        >
          {details.statusLabel}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Applicant</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
            {details.applicantName}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Programme</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
            {details.programmeName}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "var(--space-3)",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Amount</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
          {formatNaira(details.amountNaira)}
        </span>
      </div>

      {details.receiptFilename || details.onViewReceipt ? (
        <div
          style={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            background: "var(--bg-surface-dark)",
            padding: "var(--space-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <FileText size={14} color="var(--text-muted)" />
            <span
              style={{
                fontSize: 12,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {details.receiptFilename || "Payment Receipt"}
            </span>
          </div>

          {details.onViewReceipt ? (
            <button
              type="button"
              onClick={details.onViewReceipt}
              className="btn btn-secondary btn-sm"
            >
              <Eye size={12} /> View
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type PaymentReferenceDetails = BankTransferDetails;

export function PaymentReferenceCard({
  details,
}: {
  details: PaymentReferenceDetails;
}) {
  return <BankTransferCard details={details} />;
}
