-- Add flexible fee structure to training_programs
ALTER TABLE training_programs
  ADD COLUMN IF NOT EXISTS fee_type TEXT NOT NULL DEFAULT 'single' CHECK (fee_type IN ('single', 'tiered')),
  ADD COLUMN IF NOT EXISTS fee_tiers JSONB NOT NULL DEFAULT '[]';

-- Backfill existing programmes with single fee type and empty fee tiers
UPDATE training_programs
SET fee_type = 'single', fee_tiers = '[]'::jsonb
WHERE fee_type IS NULL;

-- Insert the new training programme with tiered fees
-- Using a subquery to get a creator_id from existing users
INSERT INTO training_programs (
  title,
  slug,
  description,
  venue,
  fees,
  capacity,
  status,
  breadcrumb_label,
  category_label,
  mode_label,
  duration_label,
  fee_sub_label,
  registration_deadline,
  outcomes,
  audience,
  contact_email,
  contact_phone,
  fee_type,
  fee_tiers,
  creator_id
)
SELECT
  'Wholesome Animal Products Processing & Packaging for the Market',
  'wholesome-animal-products-processing-packaging',
  'This specialized short course is designed to provide practical and industry-relevant knowledge in wholesome animal products processing, packaging for modern markets, food safety and quality assurance, value addition opportunities, and agribusiness and market readiness.',
  'University of Jos, Nigeria',
  25000,
  50,
  'published',
  'Animal Products Processing',
  'Food Processing',
  'Week One (On-site) | Week Two (Hybrid)',
  '2 Weeks (18th May – 29th May, 2026)',
  'per participant · incl. training materials, practical sessions, certification & daily feeding',
  '15 May 2026',
  ARRAY['Wholesome animal products processing', 'Packaging for modern markets', 'Food safety and quality assurance', 'Value addition opportunities', 'Agribusiness and market readiness'],
  ARRAY['Food processors', 'Entrepreneurs', 'Agro-industry professionals', 'Smallholder farmers', 'Cooperative officers'],
  'training@tcoefs.unijos.edu.ng',
  '+234 (0) 803 XXX XXXX',
  'tiered',
  '[{"label": "Students", "amount": 25000}, {"label": "Non-Students", "amount": 35000}, {"label": "Corporate / Group Sponsorship", "amount": 100000}]'::jsonb,
  (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
RETURNING id, title, slug;