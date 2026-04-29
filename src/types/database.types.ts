/**
 * Database Types - TypeScript interfaces matching the actual SQL schema
 * 
 * These types are manually created to match supabase/migrations/001_initial_schema.sql
 * Once Supabase project is set up, regenerate with:
 * supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 */

import type {
  ApplicationStatus,
  TrainingStatus,
  ElearningCourseStatus,
  PaymentStatus,
  UserRole,
  AuditAction,
} from '@/lib/contracts/status';

// ============================================================================
// CUSTOM ENUMS (matching SQL CREATE TYPE statements)
// ============================================================================

/**
 * Payment entity types for polymorphic payment references
 */
export type PaymentEntityType =
  | 'application'
  | 'training_application'
  | 'elearning_enrollment';

/**
 * Payment confirmation methods
 */
export type PaymentConfirmationMethod =
  | 'manual_bank_transfer'
  | 'webhook'
  | 'admin_override';

/**
 * @deprecated Use PaymentConfirmationMethod instead.
 */
export type PaymentConfirmedBy = PaymentConfirmationMethod;

/**
 * Email delivery status
 */
export type EmailStatus = 'pending' | 'sent' | 'failed';

export type PostgraduateProgrammeStatus =
  | 'draft'
  | 'published'
  | 'closing_soon'
  | 'closed';

/**
 * Document types for application uploads
 */
export type DocumentType =
  | 'transcript'
  | 'degree_certificate'
  | 'id_card'
  | 'cv'
  | 'passport_photo'
  | 'other';

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * User from Supabase auth.users table
 * (This is managed by Supabase Auth, not in our migrations)
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Profile - extends auth.users with portal-specific user data
 * Links to auth.users via user_id
 */
export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  verification_status: "pending" | "approved";
  location: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Role - system and custom roles for RBAC
 */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

/**
 * RolePermission - permission mappings for roles
 */
export interface RolePermission {
  id: string;
  role_id: string;
  permission: string;
  created_at: string;
}

// ============================================================================
// POSTGRADUATE APPLICATIONS
// ============================================================================

/**
 * Application - postgraduate programme application
 * Requires full admin review workflow
 */
export interface Application {
  id: string;
  user_id: string;
  programme_id: string;
  status: ApplicationStatus;
  personal_statement: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ApplicationDocument - uploaded documents for postgraduate applications
 * All files stored in Cloudflare R2, database stores only object keys
 */
export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: DocumentType;
  file_path: string; // R2 object key
  uploaded_at: string;
}

// ============================================================================
// TRAINING PROGRAMMES
// ============================================================================

/**
 * TrainingProgram - professional short courses and training programmes
 */
export interface TrainingProgram {
  id: string;
  title: string;
  slug: string;
  description: string;
  schedule: string | null; // JSON or text description
  venue: string | null;
  capacity: number | null;
  fees: number; // Stored as NUMERIC(10, 2) in DB (used when fee_type = 'single')
  status: TrainingStatus;
  breadcrumb_label: string | null;
  category_label: string | null;
  mode_label: string | null;
  duration_label: string | null;
  fee_sub_label: string | null;
  registration_deadline: string | null;
  outcomes: string[];
  audience: string[];
  contact_email: string | null;
  contact_phone: string | null;
  fee_type: "single" | "tiered";
  fee_tiers: Array<{ label: string; amount: number }>;
  creator_id: string; // User who created this programme
  created_at: string;
  updated_at: string;
}

export interface PostgraduateProgramme {
  id: string;
  title: string;
  slug: string;
  code: string;
  status: PostgraduateProgrammeStatus;
  deadline: string;
  start_date: string;
  mode: string;
  duration: string;
  fees: number;
  overview: string;
  outcomes: string[];
  eligibility: string;
  required_documents: string[];
  institution: string | null;
  awarding_body: string | null;
  qualifications: string[];
  pgd_duration: string | null;
  msc_duration: string | null;
  programme_objectives: string[];
  core_modules: string[];
  pgd_admission_requirements: string | null;
  msc_admission_requirements: string | null;
  registration_info: string | null;
  career_outcomes: string[];
  keywords: string[];
  creator_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * TrainingApplication - user enrollment in training programme
 * Auto-confirmed on payment (no admin review required)
 */
export interface TrainingApplication {
  id: string;
  training_id: string;
  user_id: string;
  status: ApplicationStatus;
  admin_notes: string | null;
  enrolled_at: string;
}

export interface TrainingMaterial {
  id: string;
  training_id: string;
  title: string;
  description: string | null;
  phase: 'pre_training' | 'session' | 'post_training';
  session_label: string | null;
  material_type: string;
  file_name: string;
  file_size_bytes: number;
  storage_path: string;
  is_published: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PAYMENTS (UNIFIED FOR ALL PROGRAMME TYPES)
// ============================================================================

/**
 * Payment - unified payment records for all programme types
 * Uses polymorphic pattern: entity_type + entity_id
 */
export interface Payment {
  id: string;
  user_id: string;
  entity_type: PaymentEntityType;
  entity_id: string; // UUID of related entity (application, training_application, or elearning_enrollment)
  rrr: string | null; // Legacy Remita Retrieval Reference (nullable in manual flow)
  amount: number; // Stored as NUMERIC(10, 2) in DB
  status: PaymentStatus;
  payment_date: string | null;
  confirmed_by: PaymentConfirmationMethod | null;
  admin_override_reason: string | null; // Required when confirmed_by = 'admin_override'
  receipt_storage_path: string | null; // R2 object key for uploaded payment receipt
  receipt_uploaded_at: string | null;
  admin_approved_at: string | null;
  admin_approved_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * BankTransferConfig - configurable destination account for manual payments
 */
export interface BankTransferConfig {
  id: string;
  label: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// E-LEARNING
// ============================================================================

/**
 * ElearningCourse - online self-paced learning courses
 */
export interface ElearningCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  status: ElearningCourseStatus;
  creator_id: string; // Instructor who created this course
  created_at: string;
  updated_at: string;
}

/**
 * ElearningModule - course content modules
 * Content types: video, text, document, quiz
 */
export interface ElearningModule {
  id: string;
  course_id: string;
  title: string;
  content_type: 'video' | 'text' | 'document' | 'quiz';
  content_url: string | null; // R2 presigned URL or external URL
  order: number; // Display order within course
  created_at: string;
}

/**
 * ElearningQuiz - module assessments
 */
export interface ElearningQuiz {
  id: string;
  module_id: string;
  title: string;
  questions: unknown; // JSONB array of questions with options and correct answers
  passing_score: number; // 0-100
  created_at: string;
}

/**
 * ElearningAssignment - module assignments requiring submission
 */
export interface ElearningAssignment {
  id: string;
  module_id: string;
  title: string;
  description: string;
  due_date: string | null;
  created_at: string;
}

/**
 * ElearningSubmission - student assignment submissions
 */
export interface ElearningSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  submission_url: string | null; // R2 object key for uploaded file
  submitted_at: string;
  graded: boolean;
  score: number | null; // Stored as NUMERIC(5, 2) in DB, range 0-100
  feedback: string | null;
}

/**
 * ElearningEnrollment - user enrollment in e-learning courses
 */
export interface ElearningEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
  created_at: string;
}

/**
 * ElearningProgress - tracks module completion for enrolled students
 */
export interface ElearningProgress {
  id: string;
  enrollment_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

/**
 * ElearningQuizSubmission - participant quiz attempt records
 */
export interface ElearningQuizSubmission {
  id: string;
  enrollment_id: string;
  quiz_id: string;
  user_id: string;
  answers: unknown;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  submitted_at: string;
}

// ============================================================================
// CERTIFICATES
// ============================================================================

/**
 * Certificate - issued for e-learning and training completion
 * NOT issued for postgraduate degrees (those are handled offline)
 */
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string; // Polymorphic: references elearning_courses OR training_programs
  certificate_number: string; // Format: TCOEFS-YYYY-XXXX
  issued_at: string;
  created_at: string;
}

// ============================================================================
// SYSTEM TABLES
// ============================================================================

/**
 * AuditLog - system-wide audit trail for all major actions
 */
export interface AuditLog {
  id: string;
  user_id: string | null; // Nullable for system actions
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_values: unknown | null; // JSONB
  new_values: unknown | null; // JSONB
  created_at: string;
}

/**
 * EmailQueue - email delivery queue with retry tracking
 */
export interface EmailQueue {
  id: string;
  to_email: string;
  template: string; // Template name (e.g., 'application-submitted', 'payment-verified')
  data: unknown; // JSONB for template rendering
  status: EmailStatus;
  attempts: number;
  sent_at: string | null;
  created_at: string;
}

// ============================================================================
// DATABASE TYPE (ROOT)
// ============================================================================

/**
 * Database - root type containing all tables
 * This structure matches Supabase's generated types format
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      roles: {
        Row: Role;
        Insert: Omit<Role, 'id' | 'created_at'>;
        Update: Partial<Omit<Role, 'id' | 'created_at'>>;
      };
      role_permissions: {
        Row: RolePermission;
        Insert: Omit<RolePermission, 'id' | 'created_at'>;
        Update: Partial<Omit<RolePermission, 'id' | 'created_at'>>;
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Application, 'id' | 'created_at'>>;
      };
      application_documents: {
        Row: ApplicationDocument;
        Insert: Omit<ApplicationDocument, 'id' | 'uploaded_at'>;
        Update: Partial<Omit<ApplicationDocument, 'id' | 'uploaded_at'>>;
      };
      training_programs: {
        Row: TrainingProgram;
        Insert: Omit<TrainingProgram, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TrainingProgram, 'id' | 'created_at'>>;
      };
      postgraduate_programmes: {
        Row: PostgraduateProgramme;
        Insert: Omit<PostgraduateProgramme, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PostgraduateProgramme, 'id' | 'created_at'>>;
      };
      training_applications: {
        Row: TrainingApplication;
        Insert: Omit<TrainingApplication, 'id' | 'enrolled_at'>;
        Update: Partial<Omit<TrainingApplication, 'id' | 'enrolled_at'>>;
      };
      training_materials: {
        Row: TrainingMaterial;
        Insert: Omit<TrainingMaterial, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TrainingMaterial, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>;
      };
      bank_transfer_configs: {
        Row: BankTransferConfig;
        Insert: Omit<BankTransferConfig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BankTransferConfig, 'id' | 'created_at'>>;
      };
      elearning_courses: {
        Row: ElearningCourse;
        Insert: Omit<ElearningCourse, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ElearningCourse, 'id' | 'created_at'>>;
      };
      elearning_modules: {
        Row: ElearningModule;
        Insert: Omit<ElearningModule, 'id' | 'created_at'>;
        Update: Partial<Omit<ElearningModule, 'id' | 'created_at'>>;
      };
      elearning_quizzes: {
        Row: ElearningQuiz;
        Insert: Omit<ElearningQuiz, 'id' | 'created_at'>;
        Update: Partial<Omit<ElearningQuiz, 'id' | 'created_at'>>;
      };
      elearning_assignments: {
        Row: ElearningAssignment;
        Insert: Omit<ElearningAssignment, 'id' | 'created_at'>;
        Update: Partial<Omit<ElearningAssignment, 'id' | 'created_at'>>;
      };
      elearning_submissions: {
        Row: ElearningSubmission;
        Insert: Omit<ElearningSubmission, 'id' | 'submitted_at'>;
        Update: Partial<Omit<ElearningSubmission, 'id' | 'submitted_at'>>;
      };
      elearning_enrollments: {
        Row: ElearningEnrollment;
        Insert: Omit<ElearningEnrollment, 'id' | 'enrolled_at' | 'created_at'>;
        Update: Partial<Omit<ElearningEnrollment, 'id' | 'enrolled_at' | 'created_at'>>;
      };
      elearning_progress: {
        Row: ElearningProgress;
        Insert: Omit<ElearningProgress, 'id'>;
        Update: Partial<Omit<ElearningProgress, 'id'>>;
      };
      elearning_quiz_submissions: {
        Row: ElearningQuizSubmission;
        Insert: Omit<ElearningQuizSubmission, 'id' | 'submitted_at'>;
        Update: never;
      };
      certificates: {
        Row: Certificate;
        Insert: Omit<Certificate, 'id' | 'issued_at' | 'created_at'>;
        Update: Partial<Omit<Certificate, 'id' | 'issued_at' | 'created_at'>>;
      };
      audit_log: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never; // Audit logs should never be updated
      };
      email_queue: {
        Row: EmailQueue;
        Insert: Omit<EmailQueue, 'id' | 'created_at'>;
        Update: Partial<Omit<EmailQueue, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      application_status: ApplicationStatus;
      training_status: TrainingStatus;
      elearning_course_status: ElearningCourseStatus;
      payment_status: PaymentStatus;
      payment_entity_type: PaymentEntityType;
      payment_confirmed_by: PaymentConfirmedBy;
      payment_confirmation_method: PaymentConfirmationMethod;
      audit_action: AuditAction;
      email_status: EmailStatus;
      document_type: DocumentType;
    };
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper type to extract table names
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Helper type to extract row types from any table
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Helper type to extract insert types from any table
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to extract update types from any table
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];
