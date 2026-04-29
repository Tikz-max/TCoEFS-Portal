-- Training participant document uploads
-- Per build-inventory.md spec: participants upload passport_photo, id_card, consent_form
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_application_id UUID NOT NULL REFERENCES training_applications(id) ON DELETE CASCADE,
  document_type training_document_type NOT NULL,
  file_path TEXT NOT NULL,
  content_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT training_documents_unique UNIQUE (training_application_id, document_type)
);

COMMENT ON TABLE training_documents IS 'Training participant uploads: passport photo, ID card, consent form';
COMMENT ON COLUMN training_documents.document_type IS 'passport_photo | id_card | consent_form';

-- Enum for document types
CREATE TYPE training_document_type AS ENUM ('passport_photo', 'id_card', 'consent_form');

-- RLS
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;

-- Participants can read their own documents
CREATE POLICY training_documents_select_participant ON training_documents
  FOR SELECT USING (
    training_application_id IN (
      SELECT id FROM training_applications
      WHERE user_id = auth.uid()
    )
  );

-- Participants can insert their own documents
CREATE POLICY training_documents_insert_participant ON training_documents
  FOR INSERT WITH CHECK (
    training_application_id IN (
      SELECT id FROM training_applications
      WHERE user_id = auth.uid()
    )
  );

-- Training coordinators and super_admin can read all documents
CREATE POLICY training_documents_select_admin ON training_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role IN ('training_coordinator', 'super_admin', 'admin')
    )
  );

-- Admin/service role can insert any documents (for data migrations)
CREATE POLICY training_documents_insert_admin ON training_documents
  FOR INSERT USING (true);

-- Admin/service role can update any documents
CREATE POLICY training_documents_update_admin ON training_documents
  FOR UPDATE USING (true);

-- Admin/service role can delete any documents
CREATE POLICY training_documents_delete_admin ON training_documents
  FOR DELETE USING (true);