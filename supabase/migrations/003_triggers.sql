-- ============================================================================
-- TCoEFS Portal - Database Triggers
-- Migration: 003_triggers.sql
-- ============================================================================
--
-- This migration creates database triggers for:
--   1. Auto-updating `updated_at` timestamp on row modifications
--   2. Auto-inserting audit log entries for tracked tables
--
-- Dependencies: 001_initial_schema.sql and 002_rls_policies.sql must be applied first
--
-- ============================================================================

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Trigger function to auto-update the `updated_at` column
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_set_updated_at IS 'Auto-updates updated_at timestamp on row modification';

-- Apply updated_at trigger to all tables with updated_at column

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON training_programs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON elearning_courses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- AUDIT LOG TRIGGER
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Trigger function to auto-insert audit log entries
-- Logs INSERT, UPDATE, DELETE operations on tracked tables
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  audit_action audit_action;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Determine the action type
  IF (TG_OP = 'INSERT') THEN
    audit_action := 'create';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    audit_action := 'update';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    audit_action := 'delete';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Insert audit log entry
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(), -- Current user (null for system actions)
    audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data
  );

  -- Return appropriate record
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_audit_log IS 'Auto-inserts audit log entries for tracked table operations';

-- -----------------------------------------------------------------------------
-- Apply audit log trigger to tracked tables
-- -----------------------------------------------------------------------------

-- Profiles (track role changes and updates)
CREATE TRIGGER audit_log_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- Applications (track submissions and status changes)
CREATE TRIGGER audit_log_applications
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- Training Programs (track creation, publication, cancellation)
CREATE TRIGGER audit_log_training_programs
  AFTER INSERT OR UPDATE OR DELETE ON training_programs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- Training Applications (track enrollments and confirmations)
CREATE TRIGGER audit_log_training_applications
  AFTER INSERT OR UPDATE OR DELETE ON training_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- Payments (track payment confirmations and overrides)
CREATE TRIGGER audit_log_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- E-Learning Courses (track publication and archival)
CREATE TRIGGER audit_log_elearning_courses
  AFTER INSERT OR UPDATE OR DELETE ON elearning_courses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- Certificates (track issuance)
CREATE TRIGGER audit_log_certificates
  AFTER INSERT OR UPDATE OR DELETE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- ============================================================================
-- BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Trigger function to auto-create e-learning progress records on enrollment
-- When a user enrolls in a course, initialize progress records for all modules
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_init_elearning_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert progress records for all modules in the enrolled course
  INSERT INTO elearning_progress (enrollment_id, module_id, completed, completed_at)
  SELECT 
    NEW.id,
    module.id,
    FALSE,
    NULL
  FROM elearning_modules module
  WHERE module.course_id = NEW.course_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_init_elearning_progress IS 'Auto-creates progress records when user enrolls in course';

CREATE TRIGGER init_elearning_progress
  AFTER INSERT ON elearning_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_init_elearning_progress();

-- -----------------------------------------------------------------------------
-- Trigger function to validate training program capacity
-- Prevents enrollment if training is at capacity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_validate_training_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_enrollment_count INTEGER;
  max_capacity INTEGER;
BEGIN
  -- Get current enrollment count and max capacity
  SELECT 
    COUNT(*),
    tp.capacity
  INTO 
    current_enrollment_count,
    max_capacity
  FROM training_applications ta
  JOIN training_programs tp ON tp.id = ta.training_id
  WHERE ta.training_id = NEW.training_id
  GROUP BY tp.capacity;

  -- Check if at capacity
  IF max_capacity IS NOT NULL AND current_enrollment_count >= max_capacity THEN
    RAISE EXCEPTION 'Training programme is at full capacity'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_validate_training_capacity IS 'Validates training capacity before allowing enrollment';

CREATE TRIGGER validate_training_capacity
  BEFORE INSERT ON training_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_training_capacity();

-- -----------------------------------------------------------------------------
-- Trigger function to prevent duplicate active enrollments
-- Ensures a user cannot enroll in the same course/training multiple times
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_prevent_duplicate_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check is already handled by UNIQUE constraint, but we add a more friendly error
  -- This is a no-op trigger that could be extended for complex duplicate logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Duplicate prevention is enforced by UNIQUE constraints in schema
-- This trigger placeholder can be extended for more complex business rules

-- -----------------------------------------------------------------------------
-- Trigger function to auto-set completed_at when progress is marked complete
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_progress_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  ELSIF NEW.completed = FALSE THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_set_progress_completed_at IS 'Auto-sets completed_at when module is marked complete';

CREATE TRIGGER set_progress_completed_at
  BEFORE UPDATE ON elearning_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_progress_completed_at();

-- -----------------------------------------------------------------------------
-- Trigger function to validate payment entity reference
-- Ensures the entity_type matches an actual record in the referenced table
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_validate_payment_entity()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that the referenced entity exists
  IF NEW.entity_type = 'application' THEN
    IF NOT EXISTS (SELECT 1 FROM applications WHERE id = NEW.entity_id) THEN
      RAISE EXCEPTION 'Referenced application does not exist'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  ELSIF NEW.entity_type = 'training_application' THEN
    IF NOT EXISTS (SELECT 1 FROM training_applications WHERE id = NEW.entity_id) THEN
      RAISE EXCEPTION 'Referenced training application does not exist'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  ELSIF NEW.entity_type = 'elearning_enrollment' THEN
    IF NOT EXISTS (SELECT 1 FROM elearning_enrollments WHERE id = NEW.entity_id) THEN
      RAISE EXCEPTION 'Referenced e-learning enrollment does not exist'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_validate_payment_entity IS 'Validates polymorphic payment entity reference';

CREATE TRIGGER validate_payment_entity
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_payment_entity();

-- -----------------------------------------------------------------------------
-- Trigger function to auto-update application/enrollment status on payment
-- When payment is confirmed, update the related entity status
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_update_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when payment status changes to successful
  IF NEW.status = 'successful' AND (OLD.status IS NULL OR OLD.status != 'successful') THEN
    
    -- Update application status to review (ready for admin review)
    IF NEW.entity_type = 'application' THEN
      UPDATE applications 
      SET status = 'review'
      WHERE id = NEW.entity_id
      AND status = 'pending';
    
    -- Auto-confirm training application (no review needed)
    ELSIF NEW.entity_type = 'training_application' THEN
      UPDATE training_applications
      SET status = 'approved'
      WHERE id = NEW.entity_id
      AND status = 'pending';
    
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_update_status_on_payment IS 'Auto-updates application/enrollment status when payment is confirmed';

CREATE TRIGGER update_status_on_payment
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_status_on_payment();

-- ============================================================================
-- CERTIFICATE NUMBER GENERATION
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Sequence for certificate numbering
-- Format: TCOEFS-YYYY-XXXX where XXXX is sequential per year
-- -----------------------------------------------------------------------------
CREATE SEQUENCE certificate_number_seq START 1;

COMMENT ON SEQUENCE certificate_number_seq IS 'Sequential counter for certificate numbers';

-- -----------------------------------------------------------------------------
-- Trigger function to auto-generate certificate number
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_generate_certificate_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  sequence_number TEXT;
BEGIN
  -- Only generate if certificate_number is not already set
  IF NEW.certificate_number IS NULL THEN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_number := LPAD(nextval('certificate_number_seq')::TEXT, 4, '0');
    NEW.certificate_number := 'TCOEFS-' || current_year || '-' || sequence_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_generate_certificate_number IS 'Auto-generates certificate number in format TCOEFS-YYYY-XXXX';

CREATE TRIGGER generate_certificate_number
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_certificate_number();

-- ============================================================================
-- VALIDATION TRIGGERS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Trigger function to prevent status regression
-- Ensures status transitions follow allowed workflows
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate application status transitions
  IF TG_TABLE_NAME = 'applications' THEN
    IF OLD.status = 'approved' OR OLD.status = 'rejected' THEN
      RAISE EXCEPTION 'Cannot modify application in terminal status: %', OLD.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Validate training program status transitions
  IF TG_TABLE_NAME = 'training_programs' THEN
    IF OLD.status = 'cancelled' OR OLD.status = 'completed' THEN
      RAISE EXCEPTION 'Cannot modify training programme in terminal status: %', OLD.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_validate_status_transition IS 'Prevents invalid status transitions';

CREATE TRIGGER validate_application_status_transition
  BEFORE UPDATE ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_validate_status_transition();

CREATE TRIGGER validate_training_status_transition
  BEFORE UPDATE ON training_programs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_validate_status_transition();

-- ============================================================================
-- TRIGGERS COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'TCoEFS Portal - Database triggers v1.0';
