"use client";

import { Check, AlertCircle, Minus, Upload, Eye } from "lucide-react";

/* ============================================================================
   DocumentChecklist
   Selected design: Progress Ring Summary
   Used in: training registration document step, applicant dashboard detail.

   A circular progress ring sits at the top of the checklist, showing
   percentage completion of required documents. The ring stroke is:
     – green-primary  when all required docs are uploaded
     – status-error   when any required doc is missing
     – green-medium   while in progress

   Below the ring, per-item rows show complete / missing / optional status
   with upload and view actions.
   ============================================================================ */

/* ── Types ───────────────────────────────────────────────────────────────── */

export type ChecklistItemStatus = "complete" | "missing" | "optional";

export interface ChecklistItem {
  key: string;
  label: string;
  hint?: string;
  status: ChecklistItemStatus;
  filename?: string;
  onUpload?: (key: string) => void;
  onView?: (key: string) => void;
}

interface DocumentChecklistProps {
  items: ChecklistItem[];
  title?: string;
  subtitle?: string;
}

/* ── Progress ring ───────────────────────────────────────────────────────── */

function ProgressRing({
  pct,
  hasMissing,
}: {
  pct: number;
  hasMissing: boolean;
}) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  const strokeColor =
    pct === 100
      ? "var(--green-primary)"
      : hasMissing
        ? "var(--status-error-text, #DC2626)"
        : "var(--green-medium)";

  return (
    <svg
      width={64}
      height={64}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle
        cx={32}
        cy={32}
        r={r}
        fill="none"
        stroke="var(--bg-surface-dark)"
        strokeWidth={6}
      />
      <circle
        cx={32}
        cy={32}
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 800ms ease-out, stroke 400ms ease",
        }}
      />
    </svg>
  );
}

/* ── Ring summary ────────────────────────────────────────────────────────── */

function RingSummary({ items }: { items: ChecklistItem[] }) {
  const required = items.filter((i) => i.status !== "optional");
  const complete = items.filter((i) => i.status === "complete");
  const missing = required.filter((i) => i.status === "missing");
  const pct =
    required.length > 0
      ? Math.round((complete.length / required.length) * 100)
      : 100;
  const hasMissing = missing.length > 0;

  return (
    <div
      style={{
        background: "var(--bg-surface-default)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        boxShadow: "var(--elevation-1)",
      }}
    >
      <ProgressRing pct={pct} hasMissing={hasMissing} />

      <div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {pct}%
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {complete.length} of {required.length} required uploaded
        </div>
        {hasMissing ? (
          <div
            style={{
              fontSize: 11,
              color: "var(--status-error-text, #DC2626)",
              fontWeight: 600,
              marginTop: 5,
            }}
          >
            {missing.length} document{missing.length > 1 ? "s" : ""} missing
          </div>
        ) : (
          <div
            style={{
              fontSize: 11,
              color: "var(--green-primary)",
              fontWeight: 600,
              marginTop: 5,
            }}
          >
            All required docs uploaded
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status icon ─────────────────────────────────────────────────────────── */

function StatusIcon({ status }: { status: ChecklistItemStatus }) {
  if (status === "complete")
    return <Check size={12} strokeWidth={2.5} aria-hidden="true" />;
  if (status === "missing")
    return <AlertCircle size={12} strokeWidth={2.5} aria-hidden="true" />;
  return <Minus size={12} strokeWidth={2.5} aria-hidden="true" />;
}

/* ── Single item row ─────────────────────────────────────────────────────── */

function Item({ item }: { item: ChecklistItem }) {
  const showUpload =
    (item.status === "missing" || item.status === "complete") && item.onUpload;
  const showView = item.status === "complete" && item.onView;

  return (
    <div
      className={`checklist-item checklist-item--${item.status}`}
      role="listitem"
    >
      {/* Icon */}
      <div className="checklist-item__icon" aria-hidden="true">
        <StatusIcon status={item.status} />
      </div>

      {/* Content */}
      <div className="checklist-item__content">
        <div className="checklist-item__label">{item.label}</div>
        {item.hint && <div className="checklist-item__hint">{item.hint}</div>}
        {item.filename && item.status === "complete" && (
          <div
            style={{
              fontSize: 11,
              color: "var(--green-primary)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.2px",
              marginTop: 2,
            }}
          >
            {item.filename}
          </div>
        )}
      </div>

      {/* Actions */}
      {(showUpload || showView) && (
        <div
          className="checklist-item__action"
          style={{ display: "flex", gap: "var(--space-2)" }}
        >
          {showView && (
            <button
              type="button"
              onClick={() => item.onView!(item.key)}
              aria-label={`View ${item.label}`}
              style={{
                width: 28,
                height: 28,
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface-default)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                transition:
                  "border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--green-primary)";
                e.currentTarget.style.color = "var(--green-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <Eye size={13} aria-hidden="true" />
            </button>
          )}
          {showUpload && (
            <button
              type="button"
              onClick={() => item.onUpload!(item.key)}
              aria-label={
                item.status === "complete"
                  ? `Re-upload ${item.label}`
                  : `Upload ${item.label}`
              }
              style={{
                height: 28,
                padding: "0 10px",
                border: `1.5px solid ${
                  item.status === "missing"
                    ? "var(--status-error-text, #DC2626)"
                    : "var(--border-default)"
                }`,
                borderRadius: "var(--radius-sm)",
                background:
                  item.status === "missing"
                    ? "var(--status-error-bg)"
                    : "var(--bg-surface-default)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                color:
                  item.status === "missing"
                    ? "var(--status-error-text, #DC2626)"
                    : "var(--text-secondary)",
                transition: "all var(--duration-fast) var(--ease-out)",
                flexShrink: 0,
                letterSpacing: "0.1px",
              }}
            >
              <Upload size={11} aria-hidden="true" />
              {item.status === "complete" ? "Replace" : "Upload"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function DocumentChecklist({
  items,
  title,
  subtitle,
}: DocumentChecklistProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div>
          {title && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.1px",
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Progress ring summary */}
      <RingSummary items={items} />

      {/* Per-item rows */}
      <div
        style={{
          background: "var(--bg-surface-default)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--elevation-1)",
        }}
        role="list"
        aria-label="Document checklist"
      >
        {items.map((item) => (
          <Item key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ── Preset document lists ───────────────────────────────────────────────── */

export const POSTGRADUATE_DOCUMENTS: Omit<
  ChecklistItem,
  "status" | "filename" | "onUpload" | "onView"
>[] = [
  {
    key: "transcript",
    label: "Academic Transcript",
    hint: "Official transcript from your most recent institution",
  },
  {
    key: "degree",
    label: "Degree Certificate",
    hint: "First degree certificate or statement of results",
  },
  {
    key: "nysc",
    label: "NYSC Certificate",
    hint: "Discharge or exemption certificate",
  },
  {
    key: "passport",
    label: "Passport Photograph",
    hint: "Recent colour photograph, plain background, max 200KB",
  },
  {
    key: "means_of_id",
    label: "Valid ID",
    hint: "National ID, international passport, or driver's licence",
  },
  {
    key: "birth_cert",
    label: "Birth Certificate",
    hint: "Or statutory declaration of age",
  },
  {
    key: "recommendation",
    label: "Letter of Recommendation",
    hint: "From an academic referee (optional but strengthens application)",
  },
];

export const TRAINING_DOCUMENTS: Omit<
  ChecklistItem,
  "status" | "filename" | "onUpload" | "onView"
>[] = [
  {
    key: "passport",
    label: "Passport Photograph",
    hint: "Recent colour photograph, plain background",
  },
  {
    key: "means_of_id",
    label: "Valid ID",
    hint: "National ID, international passport, or driver's licence",
  },
  {
    key: "proof_occupation",
    label: "Proof of Occupation",
    hint: "Employment letter, farm ownership document, or cooperative card",
  },
  {
    key: "recommendation",
    label: "Introduction Letter",
    hint: "From employer, cooperative, or local government (optional)",
  },
];
