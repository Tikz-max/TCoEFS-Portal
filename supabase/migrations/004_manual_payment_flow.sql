-- Drop the CHECK constraint on confirmed_by
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_admin_override_check;

-- Now convert the column
ALTER TABLE payments
  ALTER COLUMN confirmed_by TYPE TEXT USING confirmed_by::text;

ALTER TABLE payments
  ALTER COLUMN confirmed_by SET DEFAULT 'manual_bank_transfer';

-- Add new columns for receipt upload
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS receipt_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- RRR no longer required  
ALTER TABLE payments ALTER COLUMN rrr DROP NOT NULL;

-- Create bank_transfer_configs table
CREATE TABLE IF NOT EXISTS bank_transfer_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL DEFAULT 'default',
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bank_transfer_configs_label_unique UNIQUE (label)
);

INSERT INTO bank_transfer_configs (label, bank_name, account_number, account_name)
SELECT 'default', 'Access Bank PLC', '1886573891', 'University of Jos External Funded Account'
WHERE NOT EXISTS (SELECT 1 FROM bank_transfer_configs WHERE label = 'default');

-- RLS for bank_transfer_configs
ALTER TABLE bank_transfer_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY bank_transfer_configs_select_all_authenticated ON bank_transfer_configs
  FOR SELECT USING (auth.uid() IS NOT NULL);