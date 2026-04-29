-- ============================================================================
-- TCoEFS Portal - Seed Data
-- ============================================================================
-- This file populates initial data for development and testing.
-- 
-- IMPORTANT: Before running this file, you MUST manually create auth users
-- via Supabase Dashboard (Authentication > Users > Add User):
--
-- 1. Super Admin: admin@tcoefs.org (password: Admin123!)
-- 2. Training Coordinator: coordinator@tcoefs.org (password: Coord123!)
-- 3. Admissions Officer: admissions@tcoefs.org (password: Admit123!)
-- 4. Instructor: instructor@tcoefs.org (password: Teach123!)
--
-- After creating these users, copy their UUIDs from the dashboard and
-- replace the placeholders below (REPLACE_WITH_ADMIN_UUID, etc.)
-- ============================================================================

-- ============================================================================
-- STEP 1: User Profiles (requires manual auth.users creation first)
-- ============================================================================

-- Replace these UUIDs with actual UUIDs from auth.users after manual creation
INSERT INTO public.user_profiles (
  id,
  email,
  first_name,
  last_name,
  user_role,
  phone,
  created_at,
  updated_at
) VALUES
  -- Super Admin
  (
    'REPLACE_WITH_ADMIN_UUID'::uuid,
    'admin@tcoefs.org',
    'System',
    'Administrator',
    'super_admin',
    '+2348012345678',
    NOW(),
    NOW()
  ),
  -- Training Coordinator
  (
    'REPLACE_WITH_COORDINATOR_UUID'::uuid,
    'coordinator@tcoefs.org',
    'Jane',
    'Coordinator',
    'training_coordinator',
    '+2348012345679',
    NOW(),
    NOW()
  ),
  -- Admissions Officer
  (
    'REPLACE_WITH_ADMISSIONS_UUID'::uuid,
    'admissions@tcoefs.org',
    'John',
    'Admissions',
    'admissions_officer',
    '+2348012345680',
    NOW(),
    NOW()
  ),
  -- Instructor
  (
    'REPLACE_WITH_INSTRUCTOR_UUID'::uuid,
    'instructor@tcoefs.org',
    'Dr. Sarah',
    'Professor',
    'instructor',
    '+2348012345681',
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 2: Academic Programmes (Postgraduate Degrees)
-- ============================================================================

INSERT INTO public.programmes (
  id,
  name,
  description,
  level,
  duration_months,
  duration_display,
  application_fee,
  tuition_fee,
  requirements,
  is_active,
  max_applications_per_cycle,
  application_deadline,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'MSc in Food Security and Nutrition',
    'Master of Science programme focusing on food security, nutrition policy, and sustainable agriculture practices.',
    'masters',
    24,
    '2 years full-time',
    25000.00,
    500000.00,
    ARRAY[
      'Bachelor''s degree in relevant field (minimum Second Class Lower)',
      'Official transcripts from all universities attended',
      'Two letters of recommendation',
      'Statement of purpose (500-1000 words)',
      'Current CV/Resume',
      'Valid means of identification'
    ],
    true,
    200,
    '2026-06-30 23:59:59+00',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'PhD in Agricultural Economics',
    'Doctoral programme in agricultural economics with emphasis on food security policy research.',
    'phd',
    48,
    '4 years full-time',
    30000.00,
    750000.00,
    ARRAY[
      'Master''s degree in Economics, Agriculture, or related field (minimum CGPA 3.5)',
      'Research proposal (2000-3000 words)',
      'Three academic references',
      'Publications or research experience preferred',
      'Official transcripts from all universities',
      'Valid means of identification'
    ],
    true,
    50,
    '2026-06-30 23:59:59+00',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'PGD in Food Technology',
    'Postgraduate Diploma in Food Technology and Processing for industry professionals.',
    'pgd',
    12,
    '1 year full-time',
    20000.00,
    300000.00,
    ARRAY[
      'Bachelor''s degree or HND in relevant field',
      'Minimum of 2 years work experience',
      'Official transcripts',
      'Statement of purpose',
      'Current CV/Resume',
      'Valid means of identification'
    ],
    true,
    100,
    '2026-06-30 23:59:59+00',
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 3: Training Programmes (Short Courses)
-- ============================================================================

INSERT INTO public.training_programmes (
  id,
  title,
  description,
  category,
  duration_days,
  training_fee,
  max_participants,
  location,
  is_published,
  requirements,
  target_audience,
  learning_outcomes,
  schedule_details,
  published_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'Climate-Smart Agriculture for Extension Workers',
    'Intensive 5-day training on climate adaptation strategies, sustainable farming practices, and extension methodologies.',
    'agricultural_extension',
    5,
    75000.00,
    40,
    'TCoEFS Training Center, Abuja',
    true,
    ARRAY[
      'Background in agriculture or extension services',
      'Basic computer literacy',
      'No prior certifications required'
    ],
    ARRAY[
      'Agricultural extension officers',
      'NGO field workers',
      'Government agricultural officers',
      'Agribusiness professionals'
    ],
    ARRAY[
      'Understand climate change impacts on agriculture',
      'Apply climate-smart agricultural practices',
      'Develop extension programmes for farmers',
      'Monitor and evaluate adaptation strategies'
    ],
    '9:00 AM - 5:00 PM daily, includes lunch and materials',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Food Safety and Quality Assurance',
    '3-day intensive training on food safety standards, HACCP principles, and quality management systems.',
    'food_safety',
    3,
    50000.00,
    30,
    'TCoEFS Training Center, Lagos',
    true,
    ARRAY[
      'Working in food processing or hospitality industry',
      'Basic understanding of food handling',
      'No prior certifications required'
    ],
    ARRAY[
      'Food processing staff',
      'Restaurant managers',
      'Quality assurance officers',
      'Health inspectors'
    ],
    ARRAY[
      'Implement HACCP principles in food operations',
      'Conduct food safety risk assessments',
      'Develop food safety management plans',
      'Meet regulatory compliance requirements'
    ],
    '9:00 AM - 4:00 PM daily, practical sessions included',
    NOW(),
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 4: E-Learning Courses
-- ============================================================================

INSERT INTO public.elearning_courses (
  id,
  title,
  description,
  category,
  difficulty_level,
  enrollment_fee,
  max_enrollments,
  is_published,
  prerequisites,
  learning_objectives,
  estimated_duration_hours,
  instructor_id,
  published_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'Introduction to Food Security',
    'Self-paced online course covering fundamental concepts of food security, nutrition, and global food systems.',
    'online_course',
    'beginner',
    15000.00,
    500,
    true,
    ARRAY['Basic internet access', 'No prior knowledge required'],
    ARRAY[
      'Define the four pillars of food security',
      'Analyze global food security challenges',
      'Understand the role of nutrition in food security',
      'Identify sustainable food system solutions'
    ],
    20,
    'REPLACE_WITH_INSTRUCTOR_UUID'::uuid,
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Sustainable Agriculture Practices',
    'Advanced online course on sustainable farming techniques, soil management, and ecological agriculture.',
    'online_course',
    'intermediate',
    25000.00,
    300,
    true,
    ARRAY[
      'Basic understanding of agriculture',
      'Completed "Introduction to Food Security" or equivalent'
    ],
    ARRAY[
      'Apply soil conservation techniques',
      'Implement integrated pest management',
      'Design sustainable farming systems',
      'Evaluate environmental impacts of agriculture'
    ],
    35,
    'REPLACE_WITH_INSTRUCTOR_UUID'::uuid,
    NOW(),
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 5: Sample Application (Postgraduate)
-- ============================================================================

-- Note: This creates a sample application in 'documents_submitted' status
-- You can use this as a template for testing the admin review workflow

INSERT INTO public.applications (
  id,
  user_id,
  programme_id,
  status,
  academic_history,
  supporting_documents,
  current_step,
  submitted_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'REPLACE_WITH_ADMIN_UUID'::uuid, -- Using admin as sample applicant for testing
    (SELECT id FROM public.programmes WHERE name = 'MSc in Food Security and Nutrition' LIMIT 1),
    'documents_submitted',
    JSONB_BUILD_OBJECT(
      'institutions', JSONB_BUILD_ARRAY(
        JSONB_BUILD_OBJECT(
          'institution_name', 'University of Agriculture, Abeokuta',
          'degree_obtained', 'BSc Agriculture',
          'graduation_year', 2022,
          'gpa', '3.8',
          'classification', 'Second Class Upper'
        )
      ),
      'work_experience', JSONB_BUILD_ARRAY(
        JSONB_BUILD_OBJECT(
          'organization', 'Federal Ministry of Agriculture',
          'position', 'Agricultural Officer',
          'start_date', '2022-08',
          'end_date', '2025-12',
          'responsibilities', 'Extension services and farmer training'
        )
      )
    ),
    JSONB_BUILD_OBJECT(
      'transcript', 'r2://transcripts/sample_transcript_2026.pdf',
      'cv', 'r2://cvs/sample_cv.pdf',
      'id_card', 'r2://ids/sample_id.pdf',
      'statement_of_purpose', 'r2://statements/sample_sop.pdf',
      'recommendation_letter_1', 'r2://recommendations/sample_rec1.pdf',
      'recommendation_letter_2', 'r2://recommendations/sample_rec2.pdf'
    ),
    4,
    NOW(),
    NOW() - INTERVAL '5 days',
    NOW()
  );

-- Create corresponding payment for the sample application
INSERT INTO public.payments (
  id,
  entity_type,
  entity_id,
  user_id,
  amount,
  fee_type,
  payment_status,
  remita_rrr,
  remita_order_id,
  payment_method,
  paid_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'application',
    (SELECT id FROM public.applications WHERE status = 'documents_submitted' LIMIT 1),
    'REPLACE_WITH_ADMIN_UUID'::uuid,
    25000.00,
    'application_fee',
    'paid',
    '220123456789',
    'APP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    'remita',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days'
  );

-- ============================================================================
-- STEP 6: Sample Training Application
-- ============================================================================

INSERT INTO public.training_applications (
  id,
  user_id,
  training_programme_id,
  status,
  organization,
  job_title,
  experience_years,
  expectations,
  special_requirements,
  confirmed_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'REPLACE_WITH_COORDINATOR_UUID'::uuid, -- Using coordinator as sample participant
    (SELECT id FROM public.training_programmes WHERE title LIKE 'Climate-Smart%' LIMIT 1),
    'confirmed',
    'State Ministry of Agriculture',
    'Extension Coordinator',
    8,
    'To learn climate adaptation strategies and train field officers in my region.',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  );

-- Create corresponding payment for training application
INSERT INTO public.payments (
  id,
  entity_type,
  entity_id,
  user_id,
  amount,
  fee_type,
  payment_status,
  remita_rrr,
  remita_order_id,
  payment_method,
  paid_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'training_application',
    (SELECT id FROM public.training_applications WHERE status = 'confirmed' LIMIT 1),
    'REPLACE_WITH_COORDINATOR_UUID'::uuid,
    75000.00,
    'training_fee',
    'paid',
    '220123456790',
    'TRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    'remita',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  );

-- ============================================================================
-- STEP 7: Sample E-Learning Enrollment
-- ============================================================================

INSERT INTO public.elearning_enrollments (
  id,
  user_id,
  course_id,
  enrollment_status,
  progress_percentage,
  enrolled_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'REPLACE_WITH_ADMISSIONS_UUID'::uuid, -- Using admissions officer as sample learner
    (SELECT id FROM public.elearning_courses WHERE title = 'Introduction to Food Security' LIMIT 1),
    'active',
    35,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NOW()
  );

-- Create corresponding payment for e-learning enrollment
INSERT INTO public.payments (
  id,
  entity_type,
  entity_id,
  user_id,
  amount,
  fee_type,
  payment_status,
  remita_rrr,
  remita_order_id,
  payment_method,
  paid_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'elearning_enrollment',
    (SELECT id FROM public.elearning_enrollments WHERE enrollment_status = 'active' LIMIT 1),
    'REPLACE_WITH_ADMISSIONS_UUID'::uuid,
    15000.00,
    'enrollment_fee',
    'paid',
    '220123456791',
    'ELN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    'remita',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '11 days',
    NOW() - INTERVAL '10 days'
  );

-- ============================================================================
-- STEP 8: Sample Course Modules (for Introduction to Food Security)
-- ============================================================================

INSERT INTO public.course_modules (
  id,
  course_id,
  title,
  description,
  order_index,
  content,
  duration_minutes,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    (SELECT id FROM public.elearning_courses WHERE title = 'Introduction to Food Security' LIMIT 1),
    'Module 1: Understanding Food Security',
    'Introduction to the concept of food security and its global importance.',
    1,
    JSONB_BUILD_OBJECT(
      'sections', JSONB_BUILD_ARRAY(
        JSONB_BUILD_OBJECT(
          'title', 'What is Food Security?',
          'type', 'video',
          'content_url', 'r2://videos/module1_section1.mp4',
          'duration_minutes', 15
        ),
        JSONB_BUILD_OBJECT(
          'title', 'The Four Pillars',
          'type', 'reading',
          'content_html', '<h2>The Four Pillars of Food Security</h2><p>Food security exists when...</p>',
          'duration_minutes', 20
        ),
        JSONB_BUILD_OBJECT(
          'title', 'Check Your Understanding',
          'type', 'quiz',
          'quiz_id', 'to_be_created',
          'duration_minutes', 10
        )
      )
    ),
    45,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM public.elearning_courses WHERE title = 'Introduction to Food Security' LIMIT 1),
    'Module 2: Global Food Systems',
    'Exploring global food production, distribution, and consumption patterns.',
    2,
    JSONB_BUILD_OBJECT(
      'sections', JSONB_BUILD_ARRAY(
        JSONB_BUILD_OBJECT(
          'title', 'Food Production Worldwide',
          'type', 'video',
          'content_url', 'r2://videos/module2_section1.mp4',
          'duration_minutes', 20
        ),
        JSONB_BUILD_OBJECT(
          'title', 'Supply Chain Challenges',
          'type', 'reading',
          'content_html', '<h2>Global Food Supply Chains</h2><p>The journey from farm to table...</p>',
          'duration_minutes', 25
        )
      )
    ),
    60,
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 9: Sample Module Completion (for active enrollment)
-- ============================================================================

INSERT INTO public.module_completions (
  id,
  enrollment_id,
  module_id,
  completed_at,
  time_spent_minutes,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    (SELECT id FROM public.elearning_enrollments WHERE enrollment_status = 'active' LIMIT 1),
    (SELECT id FROM public.course_modules WHERE title = 'Module 1: Understanding Food Security' LIMIT 1),
    NOW() - INTERVAL '7 days',
    50,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  );

-- ============================================================================
-- STEP 10: Sample Certificate (for completed training)
-- ============================================================================

-- Note: This would normally be auto-generated by trigger when training is marked complete
-- Adding manually for testing purposes

INSERT INTO public.certificates (
  id,
  certificate_type,
  entity_type,
  entity_id,
  user_id,
  certificate_number,
  issued_date,
  r2_object_key,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'training_completion',
    'training_application',
    (SELECT id FROM public.training_applications WHERE status = 'confirmed' LIMIT 1),
    'REPLACE_WITH_COORDINATOR_UUID'::uuid,
    'CERT-TRN-2026-000001',
    CURRENT_DATE,
    'r2://certificates/cert_trn_2026_000001.pdf',
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 11: Sample Notifications
-- ============================================================================

INSERT INTO public.notifications (
  id,
  user_id,
  title,
  message,
  notification_type,
  is_read,
  related_entity_type,
  related_entity_id,
  created_at
) VALUES
  (
    gen_random_uuid(),
    'REPLACE_WITH_ADMIN_UUID'::uuid,
    'Application Submitted Successfully',
    'Your application for MSc in Food Security and Nutrition has been submitted and is under review.',
    'application_status',
    false,
    'application',
    (SELECT id FROM public.applications WHERE status = 'documents_submitted' LIMIT 1),
    NOW() - INTERVAL '5 days'
  ),
  (
    gen_random_uuid(),
    'REPLACE_WITH_COORDINATOR_UUID'::uuid,
    'Training Registration Confirmed',
    'Your registration for Climate-Smart Agriculture training has been confirmed. Please check your email for details.',
    'training_status',
    true,
    'training_application',
    (SELECT id FROM public.training_applications WHERE status = 'confirmed' LIMIT 1),
    NOW() - INTERVAL '2 days'
  ),
  (
    gen_random_uuid(),
    'REPLACE_WITH_ADMISSIONS_UUID'::uuid,
    'Welcome to Introduction to Food Security',
    'You have successfully enrolled in Introduction to Food Security. Start learning today!',
    'course_update',
    true,
    'elearning_enrollment',
    (SELECT id FROM public.elearning_enrollments WHERE enrollment_status = 'active' LIMIT 1),
    NOW() - INTERVAL '10 days'
  );

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================

-- Verification Queries (uncomment to run after seeding)
-- SELECT COUNT(*) as user_count FROM public.user_profiles;
-- SELECT COUNT(*) as programme_count FROM public.programmes;
-- SELECT COUNT(*) as training_count FROM public.training_programmes;
-- SELECT COUNT(*) as course_count FROM public.elearning_courses;
-- SELECT COUNT(*) as payment_count FROM public.payments WHERE payment_status = 'paid';
-- SELECT COUNT(*) as notification_count FROM public.notifications;

-- Expected Counts:
-- user_profiles: 4 (admin, coordinator, admissions, instructor)
-- programmes: 3 (MSc, PhD, PGD)
-- training_programmes: 2 (Climate-Smart Agriculture, Food Safety)
-- elearning_courses: 2 (Intro to Food Security, Sustainable Agriculture)
-- payments: 3 (1 application, 1 training, 1 e-learning - all paid)
-- notifications: 3 (1 per sample user)
-- applications: 1 (documents_submitted status)
-- training_applications: 1 (confirmed status)
-- elearning_enrollments: 1 (active status, 35% progress)
-- course_modules: 2 (for Intro to Food Security course)
-- module_completions: 1 (Module 1 completed)
-- certificates: 1 (training completion certificate)
