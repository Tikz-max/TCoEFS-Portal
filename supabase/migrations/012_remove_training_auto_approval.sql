-- Remove auto-approval for training applications on payment
-- Admins must now manually approve/reject training registrations after payment receipt upload.
-- Postgraduate applications still transition to 'review' status automatically.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_update_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when payment status changes to successful
  IF NEW.status = 'successful' AND (OLD.status IS NULL OR OLD.status != 'successful') THEN
    
    -- Update postgraduate application status to review (ready for admin review)
    IF NEW.entity_type = 'application' THEN
      UPDATE applications 
      SET status = 'review'
      WHERE id = NEW.entity_id
      AND status = 'pending';
    
    -- Training applications are no longer auto-approved on payment.
    -- Admins must manually review and approve/reject after receipt upload.
    ELSIF NEW.entity_type = 'training_application' THEN
      -- No automatic status change; application remains pending for manual review.
      NULL;
    
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_update_status_on_payment IS 'Auto-updates postgraduate application to review on payment. Training applications require manual approval.';
