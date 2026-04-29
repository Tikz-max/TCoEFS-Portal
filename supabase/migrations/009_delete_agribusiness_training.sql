-- Delete Agribusiness Development & Market Access training programme completely
-- This removes the programme that was stored in LEGACY_CONTENT but never had a database record
-- -----------------------------------------------------------------------------
DELETE FROM public.training_programs WHERE slug = 'agribusiness-development-market-access';