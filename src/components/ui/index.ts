/* ============================================================================
   TCoEFS Portal — UI Component Barrel Export
   Phase 2: All base UI components
   Import from '@/components/ui' for clean, tree-shakeable imports.
   ============================================================================ */

/* ── Buttons ─────────────────────────────────────────────────────────────── */
export {
  Button,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  DangerButton,
  VerifyButton,
  IconButton,
} from "./buttons/Button";
export type {} from "./buttons/Button";

/* ── Cards ───────────────────────────────────────────────────────────────── */
export {
  Card,
  InteractiveCard,
  KPICard,
  ProgrammeCard,
  CourseCard,
  PaymentReferenceCard,
  CertificateCard,
  AuthCard,
} from "./cards/Card";

/* ── Forms & Inputs ──────────────────────────────────────────────────────── */
export {
  InputLabel,
  FormGroup,
  ErrorMessage,
  HintText,
  Input,
  Textarea,
  Select,
  UploadZone,
} from "./forms/FormElements";

/* ── Badges ──────────────────────────────────────────────────────────────── */
export {
  Badge,
  PendingBadge,
  ReviewBadge,
  ApprovedBadge,
  RejectedBadge,
  VerifiedBadge,
  IncompleteBadge,
  OpenBadge,
  ClosingSoonBadge,
  ClosedBadge,
  AwaitingBadge,
  NotStartedBadge,
  InProgressBadge,
  CompletedBadge,
  FailedBadge,
  GoldBadge,
} from "./badges/Badge";
export type { BadgeVariant } from "./badges/Badge";

/* ── Progress ────────────────────────────────────────────────────────────── */
export {
  StepProgress,
  LinearProgressBar,
  ProgressRing,
  ChecklistItem,
  DocumentChecklist,
} from "./progress/Progress";
export type { Step, StepState, ChecklistItemState } from "./progress/Progress";

/* ── Tables ──────────────────────────────────────────────────────────────── */
export {
  TableContainer,
  TableSearch,
  TableToolbar,
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableActions,
  TableRefId,
} from "./tables/Table";

/* ── Notifications ───────────────────────────────────────────────────────── */
export { Toast, ToastContainer, useToast } from "./notifications/Toast";
export type {
  ToastVariant,
  ToastItem,
  ToastControls,
} from "./notifications/Toast";

/* ── Modals ──────────────────────────────────────────────────────────────── */
export { ConfirmationModal } from "./modals/ConfirmationModal";
export type { ModalIconType } from "./modals/ConfirmationModal";

export { Drawer } from "./modals/Drawer";

/* ── Utility ─────────────────────────────────────────────────────────────── */
export { Breadcrumb } from "./utility/Breadcrumb";
export type { BreadcrumbItem } from "./utility/Breadcrumb";

export { PageSectionHeader } from "./utility/PageSectionHeader";

export { EmptyState } from "./utility/EmptyState";
export type { EmptyStatePreset } from "./utility/EmptyState";

export {
  SkeletonCard,
  SkeletonTableRow,
  SkeletonAvatar,
  SkeletonThumbnail,
  SkeletonLine,
  SkeletonKPICard,
} from "./utility/Skeleton";

export { PageLoading } from "./utility/PageLoading";

export { Pagination } from "./utility/Pagination";
