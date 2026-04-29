CREATE TABLE IF NOT EXISTS training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('pre_training', 'session', 'post_training')),
  session_label TEXT,
  material_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_materials_training_id
  ON training_materials(training_id);

CREATE INDEX IF NOT EXISTS idx_training_materials_phase
  ON training_materials(phase);

CREATE INDEX IF NOT EXISTS idx_training_materials_published
  ON training_materials(is_published);

ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY training_materials_select_admin ON training_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('training_coordinator', 'super_admin')
    )
  );

CREATE POLICY training_materials_insert_admin ON training_materials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('training_coordinator', 'super_admin')
    )
  );

CREATE POLICY training_materials_update_admin ON training_materials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('training_coordinator', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('training_coordinator', 'super_admin')
    )
  );

CREATE POLICY training_materials_delete_admin ON training_materials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('training_coordinator', 'super_admin')
    )
  );

CREATE POLICY training_materials_select_participant ON training_materials
  FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1
      FROM training_applications
      WHERE training_applications.training_id = training_materials.training_id
        AND training_applications.user_id = auth.uid()
    )
  );
