-- Add admin_notes column to applications and training_applications
-- Stores rejection reasons from admin review
-- -----------------------------------------------------------------------------
ALTER TABLE applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN applications.admin_notes IS 'Admin feedback/rejection reason for this application';
COMMENT ON COLUMN training_applications.admin_notes IS 'Admin feedback/rejection reason for this registration';