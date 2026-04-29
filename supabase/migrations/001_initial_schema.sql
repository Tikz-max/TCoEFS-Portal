-- ============================================================================
-- TCoEFS Portal - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================================
--
-- This migration creates the complete database schema for the TCoEFS Portal,
-- including tables for:
--   - User profiles and role-based access control
--   - Postgraduate applications
--   - Training programme registrations
--   - E-learning courses and enrollments
--   - Payments (unified for all programme types)
--   - Certificates
--   - Audit logging and email queue
--
-- Dependencies: Supabase Auth (auth.users table must exist)
--
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- User roles in the system
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admissions_officer',
  'training_coordinator',
  'instructor',
  'participant'
);

-- Application statuses (postgraduate programmes)
CREATE TYPE application_status AS ENUM (
  'pending',
  'review',
  'approved',
  'rejected'
);

-- Training programme statuses
CREATE TYPE training_status AS ENUM (
  'draft',
  'pending_publish',
  'published',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled'
);

-- E-learning course statuses
CREATE TYPE elearning_course_status AS ENUM (
  'draft',
  'pending_publish',
  'published',
  'archived'
);

-- Payment statuses (unified for all payment types)
CREATE TYPE payment_status AS ENUM (
  'pending',
  'successful',
  'failed'
);

-- Payment entity types (polymorphic reference)
CREATE TYPE payment_entity_type AS ENUM (
  'application',
  'training_application',
  'elearning_enrollment'
);

-- Payment confirmation method
CREATE TYPE payment_confirmed_by AS ENUM (
  'webhook',
  'admin_override'
);

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'approve',
  'reject',
  'login',
  'logout',
  'payment'
);

-- Email queue status
CREATE TYPE email_status AS ENUM (
  'pending',
  'sent',
  'failed'
);

-- Document types for application uploads
CREATE TYPE document_type AS ENUM (
  'transcript',
  'degree_certificate',
  'id_card',
  'cv',
  'passport_photo',
  'other'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Profiles Table
-- Links to auth.users and extends with portal-specific user data
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'participant',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT profiles_first_name_length CHECK (char_length(first_name) >= 2),
  CONSTRAINT profiles_last_name_length CHECK (char_length(last_name) >= 2),
  CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$')
);

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON COLUMN profiles.user_id IS 'Foreign key to auth.users table';
COMMENT ON COLUMN profiles.role IS 'User role determines dashboard access and permissions';

-- -----------------------------------------------------------------------------
-- Roles Table
-- System and custom roles for RBAC
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT roles_name_length CHECK (char_length(name) >= 3),
  CONSTRAINT roles_name_format CHECK (name ~ '^[a-z_]+$')
);

COMMENT ON TABLE roles IS 'System and custom roles for role-based access control';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted or modified';

-- -----------------------------------------------------------------------------
-- Role Permissions Table
-- Maps permissions to roles
-- -----------------------------------------------------------------------------
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT role_permissions_unique UNIQUE (role_id, permission),
  CONSTRAINT role_permissions_permission_format CHECK (permission ~ '^[a-z_:]+$')
);

COMMENT ON TABLE role_permissions IS 'Permission mappings for roles';
COMMENT ON COLUMN role_permissions.permission IS 'Permission string (e.g., applications:read, training:publish)';

-- ============================================================================
-- POSTGRADUATE APPLICATIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Applications Table
-- Postgraduate programme applications with full review workflow
-- -----------------------------------------------------------------------------
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  programme_id TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  personal_statement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT applications_programme_id_length CHECK (char_length(programme_id) >= 3)
);

COMMENT ON TABLE applications IS 'Postgraduate programme applications requiring admin review';
COMMENT ON COLUMN applications.programme_id IS 'Programme slug identifier (e.g., msc-food-science)';
COMMENT ON COLUMN applications.personal_statement IS 'Applicant personal statement text';

-- -----------------------------------------------------------------------------
-- Application Documents Table
-- Uploaded documents for postgraduate applications (stored in R2)
-- -----------------------------------------------------------------------------
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT application_documents_file_path_length CHECK (char_length(file_path) >= 10)
);

COMMENT ON TABLE application_documents IS 'Document uploads for postgraduate applications (R2 object keys)';
COMMENT ON COLUMN application_documents.file_path IS 'Full R2 object key (e.g., documents/applications/{userId}/{appId}/transcript.pdf)';

-- ============================================================================
-- TRAINING PROGRAMMES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Training Programs Table
-- Professional short courses and training programmes
-- -----------------------------------------------------------------------------
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  schedule TEXT,
  venue TEXT,
  capacity INTEGER,
  fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status training_status NOT NULL DEFAULT 'draft',
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT training_programs_title_length CHECK (char_length(title) >= 5),
  CONSTRAINT training_programs_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT training_programs_fees_positive CHECK (fees >= 0),
  CONSTRAINT training_programs_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
);

COMMENT ON TABLE training_programs IS 'Professional training programmes and short courses';
COMMENT ON COLUMN training_programs.slug IS 'URL-safe unique identifier';
COMMENT ON COLUMN training_programs.schedule IS 'JSON or text description of training schedule';
COMMENT ON COLUMN training_programs.creator_id IS 'Training coordinator who created this programme';

-- -----------------------------------------------------------------------------
-- Training Applications Table
-- User enrollments in training programmes (auto-confirmed on payment)
-- -----------------------------------------------------------------------------
CREATE TABLE training_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT training_applications_unique UNIQUE (training_id, user_id)
);

COMMENT ON TABLE training_applications IS 'User enrollments in training programmes';
COMMENT ON COLUMN training_applications.enrolled_at IS 'Timestamp of registration (before payment confirmation)';

-- ============================================================================
-- PAYMENTS (UNIFIED FOR ALL PROGRAMME TYPES)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Payments Table
-- Unified payment records for all payment types (postgrad, training, e-learning)
-- Uses polymorphic pattern with entity_type + entity_id
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type payment_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  rrr TEXT NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  confirmed_by payment_confirmed_by,
  admin_override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT payments_amount_positive CHECK (amount > 0),
  CONSTRAINT payments_rrr_format CHECK (rrr ~ '^[0-9]{12}$'),
  CONSTRAINT payments_entity_reference_unique UNIQUE (entity_type, entity_id),
  CONSTRAINT payments_admin_override_check CHECK (
    (confirmed_by = 'admin_override' AND admin_override_reason IS NOT NULL) OR
    (confirmed_by != 'admin_override' AND admin_override_reason IS NULL) OR
    confirmed_by IS NULL
  )
);

COMMENT ON TABLE payments IS 'Unified payment records for all programme types via Remita';
COMMENT ON COLUMN payments.entity_type IS 'Type of entity being paid for (application, training_application, elearning_enrollment)';
COMMENT ON COLUMN payments.entity_id IS 'UUID of the related entity';
COMMENT ON COLUMN payments.rrr IS 'Remita Retrieval Reference (12 digits)';
COMMENT ON COLUMN payments.confirmed_by IS 'How payment was confirmed (webhook is authoritative)';
COMMENT ON COLUMN payments.admin_override_reason IS 'Required when super_admin manually overrides payment status';

-- ============================================================================
-- E-LEARNING
-- ============================================================================

-- -----------------------------------------------------------------------------
-- E-Learning Courses Table
-- Online self-paced learning courses
-- -----------------------------------------------------------------------------
CREATE TABLE elearning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  thumbnail TEXT,
  status elearning_course_status NOT NULL DEFAULT 'draft',
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT elearning_courses_title_length CHECK (char_length(title) >= 5),
  CONSTRAINT elearning_courses_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE elearning_courses IS 'E-learning courses for online self-paced learning';
COMMENT ON COLUMN elearning_courses.creator_id IS 'Instructor who created this course';

-- -----------------------------------------------------------------------------
-- E-Learning Modules Table
-- Course content modules (videos, text, documents, quizzes)
-- -----------------------------------------------------------------------------
CREATE TABLE elearning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES elearning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT elearning_modules_title_length CHECK (char_length(title) >= 3),
  CONSTRAINT elearning_modules_content_type_valid CHECK (content_type IN ('video', 'text', 'document', 'quiz')),
  CONSTRAINT elearning_modules_unique_order UNIQUE (course_id, "order")
);

COMMENT ON TABLE elearning_modules IS 'Course content modules';
COMMENT ON COLUMN elearning_modules.content_url IS 'URL to video/document (may be R2 presigned URL or external)';
COMMENT ON COLUMN elearning_modules."order" IS 'Display order within the course';

-- -----------------------------------------------------------------------------
-- E-Learning Quizzes Table
-- Assessments for modules
-- -----------------------------------------------------------------------------
CREATE TABLE elearning_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES elearning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT elearning_quizzes_title_length CHECK (char_length(title) >= 3),
  CONSTRAINT elearning_quizzes_passing_score_range CHECK (passing_score >= 0 AND passing_score <= 100)
);

COMMENT ON TABLE elearning_quizzes IS 'Module quizzes and assessments';
COMMENT ON COLUMN elearning_quizzes.questions IS 'JSON array of questions with options and correct answers';
COMMENT ON COLUMN elearning_quizzes.passing_score IS 'Minimum score required to pass (0-100)';

-- -----------------------------------------------------------------------------
-- E-Learning Assignments Table
-- Assignments for modules
-- -----------------------------------------------------------------------------
CREATE TABLE elearning_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES elearning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT elearning_assignments_title_length CHECK (char_length(title) >= 3)
);

COMMENT ON TABLE elearning_assignments IS 'Module assignments requiring submission';

-- -----------------------------------------------------------------------------
-- E-Learning Submissions Table
-- Student assignment submissions
-- -----------------------------------------------------------------------------
CREATE TABLE elearning_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES elearning_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded BOOLEAN NOT NULL DEFAULT FALSE,
  score NUMERIC(5, 2),
  feedback TEXT,
  
  -- Constraints
  CONSTRAINT elearning_submissions_unique UNIQUE (assignment_id, user_id),
  CONSTRAINT elearning_submissions_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

COMMENT ON TABLE elearning_submissions IS 'Student submissions for assignments';
COMMENT ON COLUMN elearning_submissions.submission_url IS 'R2 object key for uploaded submission file';

-- -----------------------------------------------------------------------------
-- E-Learning Enrollments Table
-- User enrollments in courses
-- -----------------------------------------------------------------------------
CREATE TABLE elearning_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES elearning_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT elearning_enrollments_unique UNIQUE (course_id, user_id)
);

COMMENT ON TABLE elearning_enrollments IS 'User enrollments in e-learning courses';

-- -----------------------------------------------------------------------------
-- E-Learning Progress Table
-- Tracks module completion for enrolled students
-- -----------------------------------------------------------------------------
CREATE TABLE elearning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES elearning_enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES elearning_modules(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT elearning_progress_unique UNIQUE (enrollment_id, module_id)
);

COMMENT ON TABLE elearning_progress IS 'Module completion tracking for enrolled students';

-- ============================================================================
-- CERTIFICATES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Certificates Table
-- Issued certificates for e-learning courses and training programmes
-- (NOT for postgraduate degrees - those are issued offline)
-- -----------------------------------------------------------------------------
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT certificates_number_format CHECK (certificate_number ~ '^TCOEFS-[0-9]{4}-[0-9]{4,6}$'),
  CONSTRAINT certificates_course_id_required CHECK (course_id IS NOT NULL)
);

COMMENT ON TABLE certificates IS 'Certificates issued for e-learning and training completion';
COMMENT ON COLUMN certificates.certificate_number IS 'Format: TCOEFS-YYYY-XXXX (year + sequential ID)';
COMMENT ON COLUMN certificates.course_id IS 'Reference to elearning_courses OR training_programs (polymorphic)';

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Audit Log Table
-- Tracks all major actions across the system
-- -----------------------------------------------------------------------------
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'System-wide audit trail for all major actions';
COMMENT ON COLUMN audit_log.user_id IS 'User who performed the action (nullable for system actions)';
COMMENT ON COLUMN audit_log.table_name IS 'Name of the table affected';
COMMENT ON COLUMN audit_log.record_id IS 'UUID of the affected record';

-- -----------------------------------------------------------------------------
-- Email Queue Table
-- Email delivery queue with retry logic
-- -----------------------------------------------------------------------------
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  data JSONB NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT email_queue_to_email_format CHECK (to_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  CONSTRAINT email_queue_attempts_positive CHECK (attempts >= 0)
);

COMMENT ON TABLE email_queue IS 'Email delivery queue with retry tracking';
COMMENT ON COLUMN email_queue.template IS 'Email template name (e.g., application-submitted, payment-verified)';
COMMENT ON COLUMN email_queue.data IS 'JSON data for template rendering';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Applications
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);

-- Application Documents
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);

-- Training Programs
CREATE INDEX idx_training_programs_status ON training_programs(status);
CREATE INDEX idx_training_programs_creator_id ON training_programs(creator_id);
CREATE INDEX idx_training_programs_slug ON training_programs(slug);

-- Training Applications
CREATE INDEX idx_training_applications_training_id ON training_applications(training_id);
CREATE INDEX idx_training_applications_user_id ON training_applications(user_id);
CREATE INDEX idx_training_applications_status ON training_applications(status);

-- Payments
CREATE INDEX idx_payments_rrr ON payments(rrr);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_entity ON payments(entity_type, entity_id);

-- E-Learning Courses
CREATE INDEX idx_elearning_courses_status ON elearning_courses(status);
CREATE INDEX idx_elearning_courses_creator_id ON elearning_courses(creator_id);
CREATE INDEX idx_elearning_courses_slug ON elearning_courses(slug);

-- E-Learning Modules
CREATE INDEX idx_elearning_modules_course_id ON elearning_modules(course_id);

-- E-Learning Enrollments
CREATE INDEX idx_elearning_enrollments_course_id ON elearning_enrollments(course_id);
CREATE INDEX idx_elearning_enrollments_user_id ON elearning_enrollments(user_id);

-- E-Learning Progress
CREATE INDEX idx_elearning_progress_enrollment_id ON elearning_progress(enrollment_id);
CREATE INDEX idx_elearning_progress_module_id ON elearning_progress(module_id);

-- Certificates
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

-- Audit Log
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Email Queue
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at DESC);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'TCoEFS Portal - Initial schema v1.0';
