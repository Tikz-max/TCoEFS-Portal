-- ============================================================================
-- TCoEFS Portal - E-learning Quiz Submissions
-- Migration: 005_elearning_quiz_submissions.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS elearning_quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES elearning_enrollments(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES elearning_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT elearning_quiz_submissions_score_range CHECK (score >= 0 AND score <= 100),
  CONSTRAINT elearning_quiz_submissions_total_questions_positive CHECK (total_questions > 0),
  CONSTRAINT elearning_quiz_submissions_correct_answers_range CHECK (
    correct_answers >= 0 AND correct_answers <= total_questions
  )
);

COMMENT ON TABLE elearning_quiz_submissions IS 'Participant quiz submissions for e-learning modules';

CREATE INDEX IF NOT EXISTS idx_elearning_quiz_submissions_enrollment_id
  ON elearning_quiz_submissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_elearning_quiz_submissions_quiz_id
  ON elearning_quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_elearning_quiz_submissions_user_id
  ON elearning_quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_elearning_quiz_submissions_submitted_at
  ON elearning_quiz_submissions(submitted_at DESC);

ALTER TABLE elearning_quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY elearning_quiz_submissions_select_own ON elearning_quiz_submissions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY elearning_quiz_submissions_insert_own ON elearning_quiz_submissions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM elearning_enrollments
      WHERE elearning_enrollments.id = elearning_quiz_submissions.enrollment_id
      AND elearning_enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY elearning_quiz_submissions_select_instructor ON elearning_quiz_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM elearning_enrollments
      JOIN elearning_courses ON elearning_courses.id = elearning_enrollments.course_id
      JOIN elearning_modules ON elearning_modules.course_id = elearning_courses.id
      JOIN elearning_quizzes ON elearning_quizzes.module_id = elearning_modules.id
      WHERE elearning_enrollments.id = elearning_quiz_submissions.enrollment_id
      AND elearning_quizzes.id = elearning_quiz_submissions.quiz_id
      AND elearning_courses.creator_id = auth.uid()
    )
  );

CREATE POLICY elearning_quiz_submissions_select_admin ON elearning_quiz_submissions
  FOR SELECT
  USING (auth.has_role(ARRAY['training_coordinator', 'super_admin']::user_role[]));
