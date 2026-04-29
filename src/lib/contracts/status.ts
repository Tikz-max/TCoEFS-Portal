/**
 * Canonical Status Contracts
 * 
 * These status enums are the single source of truth for all entity statuses
 * across the entire application. They must match the database constraints.
 * 
 * NO OTHER FILE should define status strings - always import from here.
 */

// ============================================================================
// Application Statuses
// ============================================================================

/**
 * Application status flow:
 * pending → review → approved OR rejected
 * 
 * - pending: Initial state when application is submitted
 * - review: Application is being reviewed by admissions officer
 * - approved: Application accepted by admissions officer
 * - rejected: Application declined by admissions officer
 */
export type ApplicationStatus = 'pending' | 'review' | 'approved' | 'rejected';

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'pending',
  'review',
  'approved',
  'rejected',
] as const;

// ============================================================================
// Training Programme Statuses
// ============================================================================

/**
 * Training programme status flow:
 * draft → pending_publish → published → registration_closed → in_progress → completed
 *                         ↘ cancelled (super_admin only, at any stage)
 * 
 * - draft: Being created/edited by coordinator
 * - pending_publish: Coordinator requested publish, awaiting super_admin approval
 * - published: Approved by super_admin, visible to participants, accepting registrations
 * - registration_closed: No longer accepting registrations (manual or auto at deadline)
 * - in_progress: Training has started
 * - completed: Training has finished
 * - cancelled: Training cancelled by super_admin (with reason logged)
 */
export type TrainingStatus =
  | 'draft'
  | 'pending_publish'
  | 'published'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const TRAINING_STATUSES: readonly TrainingStatus[] = [
  'draft',
  'pending_publish',
  'published',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
] as const;

// ============================================================================
// E-Learning Course Statuses
// ============================================================================

/**
 * E-learning course status flow:
 * draft → pending_publish → published → archived
 * 
 * - draft: Being created/edited by instructor or coordinator
 * - pending_publish: Creator requested publish, awaiting super_admin approval
 * - published: Approved by super_admin, visible to participants, enrollments allowed
 * - archived: No longer visible or enrollable (content preserved for enrolled users)
 */
export type ElearningCourseStatus = 'draft' | 'pending_publish' | 'published' | 'archived';

export const ELEARNING_COURSE_STATUSES: readonly ElearningCourseStatus[] = [
  'draft',
  'pending_publish',
  'published',
  'archived',
] as const;

// ============================================================================
// Payment Statuses
// ============================================================================

/**
 * Payment status:
 * pending → successful OR failed
 * 
 * - pending: Awaiting transfer confirmation or receipt under review
 * - successful: Payment approved by admin (AUTHORITATIVE)
 * - failed: Payment rejected by admin
 * 
 * CRITICAL: Admin approval is the SOLE authority for payment verification.
 * Receipt upload is required before approval or rejection.
 */
export type PaymentStatus = 'pending' | 'successful' | 'failed';

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'pending',
  'successful',
  'failed',
] as const;

// ============================================================================
// User Roles
// ============================================================================

/**
 * User roles in the system
 * 
 * Role hierarchy (descending authority):
 * 1. super_admin: Full system access, publish/cancel authority, admin override
 * 2. training_coordinator: Manage training programmes, request publish
 * 3. admissions_officer: Review applications, manage applicants
 * 4. instructor: Create/manage e-learning courses, grade submissions
 * 5. participant: End user - enroll in training/courses, submit applications
 * 
 * Key business rules:
 * - super_admin can perform all actions
 * - training_coordinator: auto-assigned as creator on programme creation
 * - Only super_admin can publish training/courses (after coordinator/instructor requests)
 */
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'admissions_officer'
  | 'training_coordinator'
  | 'e_learning_coordinator'
  | 'instructor'
  | 'participant';

export const USER_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'admissions_officer',
  'training_coordinator',
  'e_learning_coordinator',
  'instructor',
  'participant',
] as const;

// ============================================================================
// Audit Actions
// ============================================================================

/**
 * Audit log action types
 * 
 * All major system actions that modify state or involve sensitive operations
 * must be logged to the audit trail.
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'payment';

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'approve',
  'reject',
  'login',
  'logout',
  'payment',
] as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a string is a valid ApplicationStatus
 */
export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === 'string' && APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

/**
 * Type guard to check if a string is a valid TrainingStatus
 */
export function isTrainingStatus(value: unknown): value is TrainingStatus {
  return typeof value === 'string' && TRAINING_STATUSES.includes(value as TrainingStatus);
}

/**
 * Type guard to check if a string is a valid ElearningCourseStatus
 */
export function isElearningCourseStatus(value: unknown): value is ElearningCourseStatus {
  return typeof value === 'string' && ELEARNING_COURSE_STATUSES.includes(value as ElearningCourseStatus);
}

/**
 * Type guard to check if a string is a valid PaymentStatus
 */
export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && PAYMENT_STATUSES.includes(value as PaymentStatus);
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

/**
 * Type guard to check if a string is a valid AuditAction
 */
export function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === 'string' && AUDIT_ACTIONS.includes(value as AuditAction);
}

// ============================================================================
// Status Transition Validators
// ============================================================================

/**
 * Valid state transitions for applications
 */
export const VALID_APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  pending: ['review'],
  review: ['approved', 'rejected'],
  approved: [], // terminal state
  rejected: [], // terminal state
};

/**
 * Valid state transitions for training programmes
 */
export const VALID_TRAINING_TRANSITIONS: Record<TrainingStatus, TrainingStatus[]> = {
  draft: ['pending_publish', 'cancelled'],
  pending_publish: ['published', 'draft', 'cancelled'],
  published: ['registration_closed', 'cancelled'],
  registration_closed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // terminal state
  cancelled: [], // terminal state
};

/**
 * Valid state transitions for e-learning courses
 */
export const VALID_ELEARNING_TRANSITIONS: Record<ElearningCourseStatus, ElearningCourseStatus[]> = {
  draft: ['pending_publish'],
  pending_publish: ['published', 'draft'],
  published: ['archived'],
  archived: ['published'], // can re-publish archived courses
};

/**
 * Valid state transitions for payments
 */
export const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['successful', 'failed'],
  successful: [], // terminal state
  failed: ['pending'], // can retry payment
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition<T extends ApplicationStatus | TrainingStatus | ElearningCourseStatus | PaymentStatus>(
  from: T,
  to: T,
  transitions: Record<string, string[]>
): boolean {
  return transitions[from]?.includes(to) ?? false;
}
