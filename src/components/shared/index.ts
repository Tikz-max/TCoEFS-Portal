/* ============================================================================
   Shared Compound Components — Public API
   Import shared components from here. Never import directly from sub-folders.
   ============================================================================ */

/* ── Step Progress ───────────────────────────────────────────────────────── */
export {
  StepProgress,
  buildSteps,
  POSTGRADUATE_STEPS,
  TRAINING_STEPS,
} from "./step-progress/StepProgress";
export type { Step, StepStatus } from "./step-progress/StepProgress";

/* ── Document Checklist ──────────────────────────────────────────────────── */
export {
  DocumentChecklist,
  POSTGRADUATE_DOCUMENTS,
  TRAINING_DOCUMENTS,
} from "./document-checklist/DocumentChecklist";
export type {
  ChecklistItem,
  ChecklistItemStatus,
} from "./document-checklist/DocumentChecklist";

/* ── Payment Reference Card ──────────────────────────────────────────────── */
export { PaymentReferenceCard } from "./payment-reference-card/PaymentReferenceCard";
export type { PaymentReferenceDetails } from "./payment-reference-card/PaymentReferenceCard";

/* ── Dashboard Banner ────────────────────────────────────────────────────── */
export {
  DashboardBanner,
  buildApplicantStats,
  buildTrainingStats,
  buildElearningStats,
  buildAdminStats,
} from "./dashboard-banner/DashboardBanner";
export type {
  DashboardBannerProps,
  BannerStat,
} from "./dashboard-banner/DashboardBanner";

/* ── Audit Log ───────────────────────────────────────────────────────────── */
export { AuditLog, auditEntry } from "./audit-log/AuditLog";
export type { AuditEntry, AuditEventType } from "./audit-log/AuditLog";
