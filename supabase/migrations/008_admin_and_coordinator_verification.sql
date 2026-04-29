-- ============================================================================
-- Migration: 008_admin_and_coordinator_verification.sql
-- Purpose:
--   - Add missing operational roles (admin, e_learning_coordinator)
--   - Add coordinator verification workflow on profiles
-- ============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'e_learning_coordinator';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'approved';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_verification_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_verification_status_check
      CHECK (verification_status IN ('pending', 'approved'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
