"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, X, Copy, Check, Download } from "lucide-react";

/* ============================================================================
   AuditLog
   Color-coded chronological event trail used in admin views.

   Payment entries are clickable — they show a View button and open a
   payment detail modal with RRR, payer, amount, channel, and receipt download.

   Used on: Admin dashboard recent activity panel, Application detail view.
   ============================================================================ */

/* ── Event types ─────────────────────────────────────────────────────────── */

export type AuditEventType =
  | "application"
  | "payment"
  | "document"
  | "status"
  | "admin"
  | "system";

/* ── Payment detail (attached to payment entries) ────────────────────────── */

export interface AuditPaymentDetail {
  rrr: string;
  payerName: string;
  payerInitials: string;
  programmeName: string;
  amountNaira: number;
  transactionDate: string;
  paymentChannel: string;
  status: "confirmed" | "pending";
  onDownloadReceipt?: () => void;
}

/* ── Single log entry ────────────────────────────────────────────────────── */

export interface AuditEntry {
  id: string;
  type: AuditEventType;
  description: ReactNode;
  actor: string;
  timestamp: string;
  datetime?: string;
  /**
   * When true the row renders a View button and is clickable.
   * Should be set on payment entries that carry a paymentDetail.
   */
  clickable?: boolean;
  /**
   * Full payment detail shown in the modal when the row is clicked.
   * Only relevant when clickable is true.
   */
  paymentDetail?: AuditPaymentDetail;
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface AuditLogProps {
  entries: AuditEntry[];
  title?: string;
  card?: boolean;
  loading?: boolean;
  viewAllHref?: string;
  maxEntries?: number;
}

/* ── Event type labels ───────────────────────────────────────────────────── */

const EVENT_LABELS: Record<AuditEventType, string> = {
  application: "Application",
  payment: "Payment",
  document: "Document",
  status: "Status",
  admin: "Admin Action",
  system: "System",
};

/* ── Naira formatter ─────────────────────────────────────────────────────── */

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/* ── Copy button ─────────────────────────────────────────────────────────── */

function CopyRRR({ rrr }: { rrr: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(rrr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`card-reference__copy-btn${copied ? " card-reference__copy-btn--copied" : ""}`}
      aria-label={copied ? "Copied" : "Copy RRR"}
    >
      {copied ? (
        <>
          <Check size={12} aria-hidden="true" /> Copied
        </>
      ) : (
        <>
          <Copy size={12} aria-hidden="true" /> Copy
        </>
      )}
    </button>
  );
}

/* ── Payment detail modal ────────────────────────────────────────────────── */

function PaymentModal({
  detail,
  onClose,
}: {
  detail: AuditPaymentDetail;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,34,16,0.52)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 50,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-payment-modal-title"
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-surface-default)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 16px 48px rgba(15,34,16,0.32)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--green-medium), var(--green-primary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {detail.payerInitials}
            </div>
            <div>
              <div
                id="audit-payment-modal-title"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {detail.payerName}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 1,
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {detail.programmeName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment detail"
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
              flexShrink: 0,
              transition: "border-color var(--duration-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--text-muted)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-default)")
            }
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>

        {/* RRR */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.6px",
              textTransform: "uppercase" as const,
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Remita Retrieval Reference
          </div>
          <div
            className="card-reference__id-wrapper"
            style={{ padding: "12px 14px" }}
          >
            <span
              className="card-reference__id"
              style={{ fontSize: 17 }}
              aria-label={`Reference number: ${detail.rrr}`}
            >
              {detail.rrr}
            </span>
            <CopyRRR rrr={detail.rrr} />
          </div>
        </div>

        {/* Details */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {[
            { k: "Transaction Date", v: detail.transactionDate },
            { k: "Payment Channel", v: detail.paymentChannel },
            {
              k: "Status",
              v:
                detail.status === "confirmed"
                  ? "Confirmed by Remita"
                  : "Pending",
              highlight: detail.status === "confirmed",
            },
          ].map(({ k, v, highlight }) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {k}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: highlight
                    ? "var(--green-primary)"
                    : "var(--text-primary)",
                }}
              >
                {v}
              </span>
            </div>
          ))}

          {/* Amount */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingTop: 10,
              borderTop: "2px solid var(--border-default)",
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Amount
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--green-primary)",
              }}
            >
              {formatNaira(detail.amountNaira)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: 8,
          }}
        >
          {detail.onDownloadReceipt && (
            <button
              type="button"
              onClick={detail.onDownloadReceipt}
              className="btn btn-secondary btn-sm"
              style={{ gap: 5 }}
              aria-label="Download receipt"
            >
              <Download size={12} aria-hidden="true" />
              Receipt
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton row ────────────────────────────────────────────────────────── */

function SkeletonRow({ index }: { index: number }) {
  const widths = ["72%", "58%", "80%", "64%", "55%"];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "14px 20px",
        borderBottom: "1px solid var(--border-subtle)",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--border-default)",
          flexShrink: 0,
          marginTop: 5,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}
      >
        <div
          style={{
            height: 13,
            width: widths[index % widths.length],
            borderRadius: 4,
            background: "var(--border-subtle)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              height: 10,
              width: 80,
              borderRadius: 4,
              background: "var(--border-subtle)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              height: 10,
              width: 60,
              borderRadius: 4,
              background: "var(--border-subtle)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Entry row ───────────────────────────────────────────────────────────── */

function EntryRow({
  entry,
  isLast,
  onOpenPayment,
}: {
  entry: AuditEntry;
  isLast: boolean;
  onOpenPayment: (detail: AuditPaymentDetail) => void;
}) {
  const isClickable = entry.clickable && !!entry.paymentDetail;

  function handleClick() {
    if (isClickable && entry.paymentDetail) {
      onOpenPayment(entry.paymentDetail);
    }
  }

  return (
    <div
      className="audit-log__item"
      style={{
        borderBottom: isLast ? "none" : undefined,
        cursor: isClickable ? "pointer" : "default",
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      aria-label={
        isClickable
          ? `View payment detail for ${entry.paymentDetail?.payerName}`
          : undefined
      }
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.background =
            "var(--status-success-bg, #F0F7F0)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "";
      }}
    >
      {/* Color dot */}
      <div
        className={`audit-log__dot audit-log__dot--${entry.type}`}
        aria-hidden="true"
        title={EVENT_LABELS[entry.type]}
      />

      {/* Content */}
      <div className="audit-log__content">
        <p className="audit-log__description">{entry.description}</p>
        <div className="audit-log__meta">
          <span className="audit-log__actor">{entry.actor}</span>
          <span
            aria-hidden="true"
            style={{ color: "var(--border-default)", fontSize: 10 }}
          >
            ·
          </span>
          <time
            className="audit-log__timestamp"
            dateTime={entry.datetime}
            aria-label={`Timestamp: ${entry.timestamp}`}
          >
            {entry.timestamp}
          </time>
        </div>
      </div>

      {/* Right side: type pill + optional View button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          alignSelf: "flex-start",
          paddingTop: 2,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.4px",
            textTransform: "uppercase" as const,
            color: "var(--text-muted)",
          }}
        >
          {EVENT_LABELS[entry.type]}
        </div>

        {isClickable && (
          <div
            style={{
              height: 22,
              padding: "0 8px",
              background: "var(--status-success-bg, #F0F7F0)",
              border: "1px solid var(--green-light)",
              borderRadius: "var(--radius-sm)",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--green-primary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            <Eye size={10} />
            View
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Legend strip ────────────────────────────────────────────────────────── */

function Legend() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        gap: 16,
        padding: "10px 20px",
        borderBottom: "1px solid var(--border-subtle)",
        flexWrap: "wrap",
        background: "var(--bg-surface-dark)",
        flexShrink: 0,
      }}
    >
      {(Object.keys(EVENT_LABELS) as AuditEventType[]).map((type) => (
        <div
          key={type}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <div
            className={`audit-log__dot audit-log__dot--${type}`}
            style={{ margin: 0 }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "var(--text-muted)",
              letterSpacing: "0.3px",
            }}
          >
            {EVENT_LABELS[type]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function AuditLog({
  entries,
  title,
  card = true,
  loading = false,
  viewAllHref,
  maxEntries,
}: AuditLogProps) {
  const [activePayment, setActivePayment] = useState<AuditPaymentDetail | null>(
    null,
  );

  const displayed =
    maxEntries !== undefined ? entries.slice(0, maxEntries) : entries;
  const truncated = maxEntries !== undefined && entries.length > maxEntries;

  return (
    <>
      <div
        className={card ? "audit-log" : undefined}
        style={!card ? { display: "flex", flexDirection: "column" } : undefined}
        role="log"
        aria-label={title ?? "Activity log"}
        aria-live="polite"
      >
        {/* Title / toolbar */}
        {title && (
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.1px",
              }}
            >
              {title}
            </h3>
            {!loading && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "var(--bg-surface-dark)",
                  borderRadius: "var(--radius-full)",
                  padding: "2px 8px",
                }}
              >
                {entries.length} event{entries.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Legend */}
        <Legend />

        {/* Entries */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div aria-busy="true" aria-label="Loading activity log">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} index={i} />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              No activity recorded yet.
            </div>
          ) : (
            displayed.map((entry, index) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                isLast={
                  index === displayed.length - 1 && !truncated && !viewAllHref
                }
                onOpenPayment={setActivePayment}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {(truncated || viewAllHref) && (
          <div
            style={{
              padding: "10px 20px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexShrink: 0,
            }}
          >
            {truncated && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Showing {displayed.length} of {entries.length} events
              </span>
            )}
            {viewAllHref && (
              <a
                href={viewAllHref}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--green-primary)",
                  textDecoration: "none",
                  marginLeft: "auto",
                  transition: "opacity var(--duration-fast) var(--ease-out)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                View all activity →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Payment detail modal — rendered outside the log card */}
      {activePayment && (
        <PaymentModal
          detail={activePayment}
          onClose={() => setActivePayment(null)}
        />
      )}
    </>
  );
}

/* ── Preset entry builders ───────────────────────────────────────────────── */

export const auditEntry = {
  applicationSubmitted: (
    applicantName: string,
    programme: string,
    timestamp: string,
    datetime?: string,
  ): AuditEntry => ({
    id: `app-submitted-${Date.now()}`,
    type: "application",
    description: (
      <>
        <strong>{applicantName}</strong> submitted application for{" "}
        <strong>{programme}</strong>
      </>
    ),
    actor: applicantName,
    timestamp,
    datetime,
  }),

  paymentConfirmed: (
    payerName: string,
    amount: string,
    timestamp: string,
    paymentDetail: AuditPaymentDetail,
    datetime?: string,
  ): AuditEntry => ({
    id: `pay-confirmed-${Date.now()}`,
    type: "payment",
    clickable: true,
    description: (
      <>
        {amount} payment confirmed for <strong>{payerName}</strong>
      </>
    ),
    actor: "Remita Webhook",
    timestamp,
    datetime,
    paymentDetail,
  }),

  paymentOverridden: (
    adminName: string,
    payerName: string,
    action: "paid" | "notpaid",
    timestamp: string,
    datetime?: string,
  ): AuditEntry => ({
    id: `pay-override-${Date.now()}`,
    type: "admin",
    description: (
      <>
        <strong>{adminName}</strong> manually marked payment as{" "}
        <strong>{action === "paid" ? "Paid" : "Not Paid"}</strong> for{" "}
        {payerName}
      </>
    ),
    actor: adminName,
    timestamp,
    datetime,
  }),

  documentUploaded: (
    applicantName: string,
    documentName: string,
    timestamp: string,
    datetime?: string,
  ): AuditEntry => ({
    id: `doc-uploaded-${Date.now()}`,
    type: "document",
    description: (
      <>
        <strong>{applicantName}</strong> uploaded{" "}
        <strong>{documentName}</strong>
      </>
    ),
    actor: applicantName,
    timestamp,
    datetime,
  }),

  statusChanged: (
    adminName: string,
    applicantName: string,
    from: string,
    to: string,
    timestamp: string,
    datetime?: string,
  ): AuditEntry => ({
    id: `status-changed-${Date.now()}`,
    type: "status",
    description: (
      <>
        <strong>{adminName}</strong> moved <strong>{applicantName}</strong> from{" "}
        <strong>{from}</strong> to <strong>{to}</strong>
      </>
    ),
    actor: adminName,
    timestamp,
    datetime,
  }),

  adminAction: (
    adminName: string,
    action: string,
    timestamp: string,
    datetime?: string,
  ): AuditEntry => ({
    id: `admin-action-${Date.now()}`,
    type: "admin",
    description: (
      <>
        <strong>{adminName}</strong> {action}
      </>
    ),
    actor: adminName,
    timestamp,
    datetime,
  }),

  systemEvent: (
    description: string,
    timestamp: string,
    datetime?: string,
  ): AuditEntry => ({
    id: `system-${Date.now()}`,
    type: "system",
    description: <>{description}</>,
    actor: "System",
    timestamp,
    datetime,
  }),
};
