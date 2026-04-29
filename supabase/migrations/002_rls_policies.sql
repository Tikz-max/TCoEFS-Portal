-- ============================================================================
-- TCoEFS Portal - Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ============================================================================
--
-- This migration enables Row Level Security (RLS) on all tables and creates
-- policies to enforce data access control based on user roles.
--
-- Key Principles:
--   - Users can only see their own data unless they have admin roles
--   - super_admin has unrestricted access to all tables
--   - Role-specific access (admissions_officer, training_coordinator, instructor)
--   - Public read access for published content (training programs, e-learning courses)
--
-- Dependencies: 001_initial_schema.sql must be applied first
--
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Get current user's role from profiles table
-- Returns null if user has no profile (shouldn't happen in normal flow)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.get_user_role IS 'Get the role of the currently authenticated user';

-- -----------------------------------------------------------------------------
-- Check if current user has any of the specified roles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.has_role(allowed_roles user_role[])
RETURNS BOOLEAN AS $$
  SELECT auth.get_user_role() = ANY(allowed_roles)
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.has_role IS 'Check if current user has one of the specified roles';

-- -----------------------------------------------------------------------------
-- Check if current user is a super admin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.get_user_role() = 'super_admin'
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_super_admin IS 'Check if current user is a super admin';

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile (except role)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    role = (SELECT role FROM profiles WHERE user_id = auth.uid()) -- Cannot change own role
  );

-- Admins can read all profiles
CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT
  USING (auth.has_role(ARRAY['super_admin', 'admissions_officer', 'training_coordinator', 'instructor']::user_role[]));

-- Super admin can update any profile
CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE
  USING (auth.is_super_admin());

-- New users can insert their own profile (during registration)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ROLES & PERMISSIONS POLICIES
-- ============================================================================

-- Anyone can read roles (for UI dropdowns, etc.)
CREATE POLICY roles_select_all ON roles
  FOR SELECT
  USING (true);

-- Only super_admin can modify roles
CREATE POLICY roles_all_admin ON roles
  FOR ALL
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

-- Anyone can read role permissions
CREATE POLICY role_permissions_select_all ON role_permissions
  FOR SELECT
  USING (true);

-- Only super_admin can modify role permissions
CREATE POLICY role_permissions_all_admin ON role_permissions
  FOR ALL
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

-- ============================================================================
-- APPLICATIONS POLICIES (Postgraduate)
-- ============================================================================

-- Applicants can read their own applications
CREATE POLICY applications_select_own ON applications
  FOR SELECT
  USING (user_id = auth.uid());

-- Applicants can create applications
CREATE POLICY applications_insert_own ON applications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Applicants can update their own pending applications
CREATE POLICY applications_update_own ON applications
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Admissions officers and super_admin can read all applications
CREATE POLICY applications_select_admin ON applications
  FOR SELECT
  USING (auth.has_role(ARRAY['admissions_officer', 'super_admin']::user_role[]));

-- Admissions officers and super_admin can update applications (status changes)
CREATE POLICY applications_update_admin ON applications
  FOR UPDATE
  USING (auth.has_role(ARRAY['admissions_officer', 'super_admin']::user_role[]));

-- ============================================================================
-- APPLICATION DOCUMENTS POLICIES
-- ============================================================================

-- Applicants can read their own application documents
CREATE POLICY application_documents_select_own ON application_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Applicants can insert documents for their own applications
CREATE POLICY application_documents_insert_own ON application_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Applicants can delete their own documents (before submission)
CREATE POLICY application_documents_delete_own ON application_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = auth.uid()
      AND applications.status = 'pending'
    )
  );

-- Admissions officers and super_admin can read all documents
CREATE POLICY application_documents_select_admin ON application_documents
  FOR SELECT
  USING (auth.has_role(ARRAY['admissions_officer', 'super_admin']::user_role[]));

-- ============================================================================
-- TRAINING PROGRAMS POLICIES
-- ============================================================================

-- Anyone can read published training programs (public listing)
CREATE POLICY training_programs_select_published ON training_programs
  FOR SELECT
  USING (status = 'published');

-- Training coordinators can read all programs (including drafts)
CREATE POLICY training_programs_select_coordinator ON training_programs
  FOR SELECT
  USING (auth.has_role(ARRAY['training_coordinator', 'super_admin']::user_role[]));

-- Training coordinators can create programs
CREATE POLICY training_programs_insert_coordinator ON training_programs
  FOR INSERT
  WITH CHECK (
    auth.has_role(ARRAY['training_coordinator', 'super_admin']::user_role[]) AND
    creator_id = auth.uid()
  );

-- Training coordinators can update their own programs
CREATE POLICY training_programs_update_own ON training_programs
  FOR UPDATE
  USING (
    creator_id = auth.uid() AND
    auth.has_role(ARRAY['training_coordinator', 'super_admin']::user_role[])
  );

-- Super admin can update any program
CREATE POLICY training_programs_update_admin ON training_programs
  FOR UPDATE
  USING (auth.is_super_admin());

-- Super admin can delete programs
CREATE POLICY training_programs_delete_admin ON training_programs
  FOR DELETE
  USING (auth.is_super_admin());

-- ============================================================================
-- TRAINING APPLICATIONS POLICIES
-- ============================================================================

-- Users can read their own training applications
CREATE POLICY training_applications_select_own ON training_applications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create training applications (register for training)
CREATE POLICY training_applications_insert_own ON training_applications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM training_programs
      WHERE training_programs.id = training_applications.training_id
      AND training_programs.status = 'published'
    )
  );

-- Training coordinators and super_admin can read all applications
CREATE POLICY training_applications_select_admin ON training_applications
  FOR SELECT
  USING (auth.has_role(ARRAY['training_coordinator', 'super_admin']::user_role[]));

-- Training coordinators and super_admin can update applications
CREATE POLICY training_applications_update_admin ON training_applications
  FOR UPDATE
  USING (auth.has_role(ARRAY['training_coordinator', 'super_admin']::user_role[]));

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

-- Users can read their own payments
CREATE POLICY payments_select_own ON payments
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create payments (generate RRR)
CREATE POLICY payments_insert_own ON payments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can read all payments
CREATE POLICY payments_select_admin ON payments
  FOR SELECT
  USING (auth.has_role(ARRAY['super_admin', 'admissions_officer', 'training_coordinator']::user_role[]));

-- Only super_admin can update payments (admin override)
CREATE POLICY payments_update_admin ON payments
  FOR UPDATE
  USING (auth.is_super_admin());

-- System (service role) can update payments via webhook
-- Note: This is enforced at the API level using service role key, not RLS

-- ============================================================================
-- E-LEARNING COURSES POLICIES
-- ============================================================================

-- Anyone can read published courses (public catalog)
CREATE POLICY elearning_courses_select_published ON elearning_courses
  FOR SELECT
  USING (status = 'published');

-- Instructors can read their own courses (including drafts)
CREATE POLICY elearning_courses_select_own ON elearning_courses
  FOR SELECT
  USING (
    creator_id = auth.uid() AND
    auth.has_role(ARRAY['instructor', 'training_coordinator', 'super_admin']::user_role[])
  );

-- Instructors and coordinators can create courses
CREATE POLICY elearning_courses_insert_instructor ON elearning_courses
  FOR INSERT
  WITH CHECK (
    auth.has_role(ARRAY['instructor', 'training_coordinator', 'super_admin']::user_role[]) AND
    creator_id = auth.uid()
  );

-- Instructors can update their own courses
CREATE POLICY elearning_courses_update_own ON elearning_courses
  FOR UPDATE
  USING (
    creator_id = auth.uid() AND
    auth.has_role(ARRAY['instructor', 'training_coordinator', 'super_admin']::user_role[])
  );

-- Super admin can update any course
CREATE POLICY elearning_courses_update_admin ON elearning_courses
  FOR UPDATE
  USING (auth.is_super_admin());

-- ============================================================================
-- E-LEARNING MODULES POLICIES
-- ============================================================================

-- Anyone can read modules for published courses
CREATE POLICY elearning_modules_select_published ON elearning_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elearning_courses
      WHERE elearning_courses.id = elearning_modules.course_id
      AND elearning_courses.status = 'published'
    )
  );

-- Course creators can read/modify modules for their courses
CREATE POLICY elearning_modules_all_creator ON elearning_modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM elearning_courses
      WHERE elearning_courses.id = elearning_modules.course_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

-- Super admin can manage all modules
CREATE POLICY elearning_modules_all_admin ON elearning_modules
  FOR ALL
  USING (auth.is_super_admin());

-- ============================================================================
-- E-LEARNING QUIZZES POLICIES
-- ============================================================================

-- Enrolled users can read quizzes (but not see correct answers - handled in API)
CREATE POLICY elearning_quizzes_select_enrolled ON elearning_quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elearning_modules
      JOIN elearning_courses ON elearning_courses.id = elearning_modules.course_id
      JOIN elearning_enrollments ON elearning_enrollments.course_id = elearning_courses.id
      WHERE elearning_modules.id = elearning_quizzes.module_id
      AND elearning_enrollments.user_id = auth.uid()
    )
  );

-- Course creators can manage quizzes
CREATE POLICY elearning_quizzes_all_creator ON elearning_quizzes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM elearning_modules
      JOIN elearning_courses ON elearning_courses.id = elearning_modules.course_id
      WHERE elearning_modules.id = elearning_quizzes.module_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- E-LEARNING ASSIGNMENTS POLICIES
-- ============================================================================

-- Enrolled users can read assignments
CREATE POLICY elearning_assignments_select_enrolled ON elearning_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elearning_modules
      JOIN elearning_courses ON elearning_courses.id = elearning_modules.course_id
      JOIN elearning_enrollments ON elearning_enrollments.course_id = elearning_courses.id
      WHERE elearning_modules.id = elearning_assignments.module_id
      AND elearning_enrollments.user_id = auth.uid()
    )
  );

-- Course creators can manage assignments
CREATE POLICY elearning_assignments_all_creator ON elearning_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM elearning_modules
      JOIN elearning_courses ON elearning_courses.id = elearning_modules.course_id
      WHERE elearning_modules.id = elearning_assignments.module_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- E-LEARNING SUBMISSIONS POLICIES
-- ============================================================================

-- Users can read their own submissions
CREATE POLICY elearning_submissions_select_own ON elearning_submissions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create/update their own submissions
CREATE POLICY elearning_submissions_insert_own ON elearning_submissions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY elearning_submissions_update_own ON elearning_submissions
  FOR UPDATE
  USING (user_id = auth.uid() AND NOT graded)
  WITH CHECK (user_id = auth.uid());

-- Instructors can read all submissions for their courses
CREATE POLICY elearning_submissions_select_instructor ON elearning_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elearning_assignments
      JOIN elearning_modules ON elearning_modules.id = elearning_assignments.module_id
      JOIN elearning_courses ON elearning_courses.id = elearning_modules.course_id
      WHERE elearning_assignments.id = elearning_submissions.assignment_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

-- Instructors can grade submissions for their courses
CREATE POLICY elearning_submissions_update_instructor ON elearning_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM elearning_assignments
      JOIN elearning_modules ON elearning_modules.id = elearning_assignments.module_id
      JOIN elearning_courses ON elearning_courses.id = elearning_modules.course_id
      WHERE elearning_assignments.id = elearning_submissions.assignment_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- E-LEARNING ENROLLMENTS POLICIES
-- ============================================================================

-- Users can read their own enrollments
CREATE POLICY elearning_enrollments_select_own ON elearning_enrollments
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can enroll in published courses
CREATE POLICY elearning_enrollments_insert_own ON elearning_enrollments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM elearning_courses
      WHERE elearning_courses.id = elearning_enrollments.course_id
      AND elearning_courses.status = 'published'
    )
  );

-- Instructors can read enrollments for their courses
CREATE POLICY elearning_enrollments_select_instructor ON elearning_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elearning_courses
      WHERE elearning_courses.id = elearning_enrollments.course_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

-- Admins can read all enrollments
CREATE POLICY elearning_enrollments_select_admin ON elearning_enrollments
  FOR SELECT
  USING (auth.has_role(ARRAY['training_coordinator', 'super_admin']::user_role[]));

-- ============================================================================
-- E-LEARNING PROGRESS POLICIES
-- ============================================================================

-- Users can read their own progress
CREATE POLICY elearning_progress_select_own ON elearning_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elearning_enrollments
      WHERE elearning_enrollments.id = elearning_progress.enrollment_id
      AND elearning_enrollments.user_id = auth.uid()
    )
  );

-- Users can update their own progress
CREATE POLICY elearning_progress_update_own ON elearning_progress
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM elearning_enrollments
      WHERE elearning_enrollments.id = elearning_progress.enrollment_id
      AND elearning_enrollments.user_id = auth.uid()
    )
  );

-- Users can insert progress records (auto-created on enrollment)
CREATE POLICY elearning_progress_insert_own ON elearning_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM elearning_enrollments
      WHERE elearning_enrollments.id = elearning_progress.enrollment_id
      AND elearning_enrollments.user_id = auth.uid()
    )
  );

-- Instructors can read progress for their courses
CREATE POLICY elearning_progress_select_instructor ON elearning_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elearning_enrollments
      JOIN elearning_courses ON elearning_courses.id = elearning_enrollments.course_id
      WHERE elearning_enrollments.id = elearning_progress.enrollment_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- CERTIFICATES POLICIES
-- ============================================================================

-- Users can read their own certificates
CREATE POLICY certificates_select_own ON certificates
  FOR SELECT
  USING (user_id = auth.uid());

-- System can insert certificates (via service role)
-- Note: Certificate generation is restricted at API level

-- Admins can read all certificates
CREATE POLICY certificates_select_admin ON certificates
  FOR SELECT
  USING (auth.has_role(ARRAY['training_coordinator', 'instructor', 'super_admin']::user_role[]));

-- Super admin can manage certificates
CREATE POLICY certificates_all_admin ON certificates
  FOR ALL
  USING (auth.is_super_admin());

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Only super_admin can read audit logs
CREATE POLICY audit_log_select_admin ON audit_log
  FOR SELECT
  USING (auth.is_super_admin());

-- No one can modify audit logs via app (only triggers and system)
-- Audit logs are insert-only via triggers

-- ============================================================================
-- EMAIL QUEUE POLICIES
-- ============================================================================

-- No direct user access to email queue
-- All operations happen via service role (API routes and background jobs)

-- Super admin can read email queue for debugging
CREATE POLICY email_queue_select_admin ON email_queue
  FOR SELECT
  USING (auth.is_super_admin());

-- ============================================================================
-- RLS POLICIES COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'TCoEFS Portal - RLS policies v1.0';
