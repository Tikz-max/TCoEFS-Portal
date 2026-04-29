# Phase 0 — Contracts & Shared Types

## Agent Prompt

```
You are a veteran senior backend engineer from a FAANG company with 15+ years of experience building scalable, secure, production-grade systems. You have deep expertise in:

- PostgreSQL database design, migrations, RLS policies, and performance optimization
- Next.js App Router API routes with proper error handling and validation
- Supabase (Auth, Database, Storage, Edge Functions)
- TypeScript type safety and clean architecture

Read the instructions below carefully, then plan and implement the deliverables.

## Your Task

Create the canonical type definitions and contract constants that every other Phase depends on. Nothing else in Phase 8 compiles without Phase 0 types.

## Deliverables

Create the following files in `portal/src/`:

### 1. `types/database.ts`

Write TypeScript interfaces for all database tables:

- **Profile** — id, user_id, first_name, last_name, phone, role, location, created_at, updated_at
- **User** — id, email, created_at (Supabase auth.users)
- **Role** — id, name (system role name), description, is_system, created_at
- **RolePermission** — id, role_id, permission, created_at
- **Application** — id, user_id, programme_id, status, personal_statement, created_at, updated_at
- **ApplicationDocument** — id, application_id, document_type, file_path, uploaded_at
- **TrainingProgram** — id, title, slug, description, schedule, venue, capacity, fees, status, creator_id, created_at, updated_at
- **TrainingApplication** — id, training_id, user_id, status, enrolled_at
- **Payment** — id, user_id, rrr, amount, status, payment_date, programme_id, created_at, updated_at
- **ElearningCourse** — id, title, slug, description, thumbnail, status, creator_id, created_at, updated_at
- **ElearningModule** — id, course_id, title, content_type, content_url, order, created_at
- **ElearningQuiz** — id, module_id, title, questions (JSON), passing_score, created_at
- **ElearningAssignment** — id, module_id, title, description, due_date, created_at
- **ElearningSubmission** — id, assignment_id, user_id, submission_url, submitted_at, graded, score, feedback
- **ElearningEnrollment** — id, course_id, user_id, enrolled_at, created_at
- **ElearningProgress** — id, enrollment_id, module_id, completed, completed_at
- **Certificate** — id, user_id, course_id, certificate_number, issued_at, created_at
- **AuditLog** — id, user_id, action, table_name, record_id, old_values, new_values, created_at
- **EmailQueue** — id, to_email, template, data, status, attempts, sent_at, created_at

### 2. `lib/contracts/status.ts`

Canonical status enums:

```ts
export type ApplicationStatus = 'pending' | 'review' | 'approved' | 'rejected';
export type TrainingStatus = 'draft' | 'pending_publish' | 'published' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
export type ElearningCourseStatus = 'draft' | 'pending_publish' | 'published' | 'archived';
export type PaymentStatus = 'pending' | 'successful' | 'failed';
export type UserRole = 'super_admin' | 'admissions_officer' | 'training_coordinator' | 'instructor' | 'participant';
export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'approve' | 'reject' | 'login' | 'logout' | 'payment';
```

### 3. `lib/contracts/api.ts`

API endpoint path constants:

```ts
export const API = {
  APPLICATIONS: '/api/applications',
  TRAINING: '/api/training',
  PAYMENTS: '/api/payments',
  ELEARNING: '/api/elearning',
  UPLOADS: '/api/uploads',
  CERTIFICATES: '/api/certificates',
  EMAIL: '/api/email',
} as const;
```

### 4. `types/api.ts`

Unified API response wrapper:

```ts
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
```

## Key Business Rules (Non-Negotiable)

- Status enums in `contracts/status.ts` are the **single source of truth**
- All subsequent phases import from these files — never duplicate field definitions
- Phase 0 must pass `tsc --noEmit` with zero errors before Phase 1 begins

## Verification

Run `npm run typecheck` from `portal/` directory — must pass with zero errors.

## Starting Point

You have been provided with existing code in:
- `src/lib/supabase/server.ts` — cookie-bridged server client
- `src/lib/supabase/client.ts` — browser client helper
- `src/lib/supabase/admin.ts` — service-role client
- `src/lib/utils/env.ts` — fail-fast env helpers
- Existing frontend pages in `app/(dashboard)/**` with mock data

---

Now implement Phase 0 and create the type files above.