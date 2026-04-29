# Phase 1 — Database Schema + Migrations + RLS + Seed

## Agent Prompt

```
You are a veteran senior backend engineer from a FAANG company with 15+ years of experience building scalable, secure, production-grade systems. You have deep expertise in:

- PostgreSQL database design, migrations, RLS policies, and performance optimization
- Supabase (Auth, Database, Storage, Edge Functions)
- TypeScript type safety and clean architecture

Read the instructions below carefully, then plan and implement the deliverables.

## Prerequisites

- Phase 0 complete: types exist in `src/types/database.ts` and `src/lib/contracts/status.ts`

## Your Task

Define the complete Postgres schema, Row Level Security policies, triggers, and seed data for local development.

## Deliverables

Create the following files in `portal/supabase/migrations/`:

### 1. `001_initial_schema.sql`

Create all tables with proper constraints, indexes, and foreign keys. Reference existing `src/lib/payment/remita.ts` for payment fields (RRR, amount, etc.).

**Tables to create (in order due to FK dependencies):**

```sql
-- profiles: links to auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'participant',
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- roles: system and custom roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- role_permissions: role-permission mapping
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission)
);

-- training_programs: training programmes
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  schedule TEXT,
  venue TEXT,
  capacity INTEGER DEFAULT 0,
  fees DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  creator_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- applications: programme applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  programme_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  personal_statement TEXT,
  admin_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- application_documents: uploaded documents
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- training_applications: training enrollments
CREATE TABLE training_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_id, user_id)
);

-- payments: payment records with RRR
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rrr TEXT UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  programme_id UUID REFERENCES training_programs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- elearning_courses: e-learning courses
CREATE TABLE elearning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  creator_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- elearning_modules: course modules
CREATE TABLE elearning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES elearning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_url TEXT,
  content_text TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- elearning_quizzes: module quizzes
CREATE TABLE elearning_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES elearning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- elearning_assignments: module assignments
CREATE TABLE elearning_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES elearning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- elearning_submissions: assignment submissions
CREATE TABLE elearning_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES elearning_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded BOOLEAN DEFAULT FALSE,
  score INTEGER,
  feedback TEXT,
  UNIQUE(assignment_id, user_id)
);

-- elearning_enrollments: course enrollments
CREATE TABLE elearning_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES elearning_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- elearning_progress: module completion tracking
CREATE TABLE elearning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES elearning_enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES elearning_modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, module_id)
);

-- certificates: issued certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES elearning_courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- audit_log: audit trail
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- email_queue: email queue for retries
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Add indexes for performance:
```sql
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_programme ON applications(programme_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_payments_rrr ON payments(rrr);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_elearning_enrollments_user ON elearning_enrollments(user_id);
CREATE INDEX idx_elearning_enrollments_course ON elearning_enrollments(course_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

### 2. `002_rls_policies.sql`

Enable RLS on all tables and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE elearning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- PROFILES: users read/update own row; admins read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator', 'admissions_officer'))
);

-- APPLICATIONS: applicants see own; admins see all
CREATE POLICY "Applicants see own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins see all applications" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator', 'admissions_officer'))
);
CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update applications" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator'))
);

-- TRAINING_PROGRAMS: instructors see own; coordinators see all; participants see published only
CREATE POLICY "Public see published training" ON training_programs FOR SELECT USING (status = 'published');
CREATE POLICY "Coordinators see all training" ON training_programs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator'))
);
CREATE POLICY "Coordinators manage training" ON training_programs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator'))
);

-- ELEARNING_COURSES: participants see published only
CREATE POLICY "Public see published courses" ON elearning_courses FOR SELECT USING (status = 'published');
CREATE POLICY "Admins see all courses" ON elearning_courses FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator', 'instructor'))
);
CREATE POLICY "Instructors manage courses" ON elearning_courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator', 'instructor'))
);

-- PAYMENTS: applicants see own; admins see all
CREATE POLICY "Users see own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins see all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'training_coordinator', 'admissions_officer'))
);

-- AUDIT_LOG: super_admin read-only
CREATE POLICY "Super admins view audit" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- ROLES: super_admin full access
CREATE POLICY "Super admins manage roles" ON roles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Everyone view roles" ON roles FOR SELECT USING (true);

-- CERTIFICATES: participants read own; super_admin read all
CREATE POLICY "Users view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all certificates" ON certificates FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);
```

### 3. `003_triggers.sql`

```sql
-- Auto-fill updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER training_programs_updated_at
  BEFORE UPDATE ON training_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER elearning_courses_updated_at
  BEFORE UPDATE ON elearning_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id::text,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_audit
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER training_programs_audit
  AFTER INSERT OR UPDATE OR DELETE ON training_programs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER elearning_courses_audit
  AFTER INSERT OR UPDATE OR DELETE ON elearning_courses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER payments_audit
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### 4. `seed.sql`

Minimal seed data:

```sql
-- Insert system roles
INSERT INTO roles (name, description, is_system) VALUES
('super_admin', 'Full system access', TRUE),
('training_coordinator', 'Manage training programmes', TRUE),
('admissions_officer', 'Handle applications', TRUE),
('instructor', 'Create e-learning content', TRUE),
('participant', 'Enrolled user', TRUE);

-- Insert profiles (link to auth.users - use dummy IDs for now)
INSERT INTO profiles (user_id, first_name, last_name, phone, role, location) VALUES
-- Note: These need real auth.users IDs. Create via Supabase Auth UI or insert real IDs.
('00000000-0000-0000-0000-000000000001', 'Admin', 'User', '+2348012345678', 'super_admin', 'Plateau State'),
('00000000-0000-0000-0000-000000000002', 'Coordinator', 'User', '+2348012345679', 'training_coordinator', 'Plateau State'),
('00000000-0000-0000-0000-000000000003', 'Admissions', 'Officer', '+2348012345680', 'admissions_officer', 'Plateau State');

-- Insert sample training programme
INSERT INTO training_programs (title, slug, description, schedule, venue, capacity, fees, status, creator_id) VALUES
('Sustainable Food Systems Management', 'sustainable-food-systems-management', 'Comprehensive training on sustainable food production and management', 'Mon-Fri, 9am-4pm', 'TETFAB Centre, UNijos', 50, 50000.00, 'published', '00000000-0000-0000-0000-000000000002');

-- Insert sample e-learning course
INSERT INTO elearning_courses (title, slug, description, status, creator_id) VALUES
('Introduction to Food Security', 'intro-food-security', 'Learn the fundamentals of food security and policy', 'published', '00000000-0000-0000-0000-000000000002');

-- Insert sample module
INSERT INTO elearning_modules (course_id, title, content_type, content_url, "order")
SELECT id, 'Module 1: Introduction', 'video', 'https://example.com/video1.mp4', 1
FROM elearning_courses WHERE slug = 'intro-food-security';
```

## Key Business Rules (Non-Negotiable)

- All foreign keys must have ON DELETE behavior defined
- Every table must have created_at and updated_at (where applicable)
- Audit trigger must capture auth.uid() as actor

## 🚨 USER ACTION REQUIRED

- [ ] Create a Supabase project at https://supabase.com
- [ ] Get your Project URL and anon key from Settings → API
- [ ] Run migrations: `supabase db push` or paste SQL into Supabase SQL Editor
- [ ] Add to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```
- [ ] After schema exists, regenerate types: `supabase gen types typescript --project-id your-project-id > src/types/database.ts`

## Verification

- All tables created in Supabase dashboard
- RLS policies testable via "RLS Editor" in Supabase
- Seed data visible in Table Editor

---

Now implement Phase 1 and create the migration files above.