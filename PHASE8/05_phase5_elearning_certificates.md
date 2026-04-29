# Phase 5 — E-Learning + Certificates

## Agent Prompt

```
You are a veteran senior backend engineer from a FAANG company with 15+ years of experience building scalable, secure, production-grade systems. You have deep expertise in:

- Next.js App Router API routes with proper error handling and validation
- Supabase (Auth, Database, Storage, Edge Functions)
- TypeScript type safety and clean architecture
- Zod validation

Read the instructions below carefully, then plan and implement the deliverables.

## Prerequisites

- Phases 0–4 complete
- All frontend pages in `app/(dashboard)/elearning/**` and `app/(dashboard)/admin/elearning/**` exist
- Database schema has elearning_courses, elearning_modules, elearning_quizzes, etc.

## Your Task

Implement the full e-learning content management, enrollment, progress tracking, and certificate generation pipeline. Wire up frontend pages to fetch real data.

## Deliverables

### 5a. E-Learning Courses

### 1. Update `app/api/elearning/courses/route.ts` — POST (Create Course)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const courseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!['super_admin', 'training_coordinator', 'instructor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = courseSchema.parse(body)

    // Generate slug
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: course, error } = await supabase
      .from('elearning_courses')
      .insert({
        ...data,
        slug,
        status: 'draft',
        creator_id: session.user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ courseId: course.id })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

// GET - list courses
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const myCourses = searchParams.get('myCourses') === 'true'

    let query = supabase
      .from('elearning_courses')
      .select(`
        *,
        creator:profiles(first_name, last_name),
        _count:elearning_enrollments(count),
        modules:elearning_modules(id, title, "order")
      `)

    if (status) {
      query = query.eq('status', status)
    } else if (myCourses && session) {
      // Return only enrolled courses
      const { data: enrollments } = await supabase
        .from('elearning_enrollments')
        .select('course_id')
        .eq('user_id', session.user.id)

      if (enrollments?.length) {
        query = query.in('id', enrollments.map(e => e.course_id))
      }
    } else {
      // Public: only published
      query = query.eq('status', 'published')
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('List courses error:', error)
    return NextResponse.json({ error: 'Failed to list courses' }, { status: 500 })
  }
}
```

### 2. Update `app/api/elearning/courses/[id]/route.ts` — CRUD

- **GET**: return course with modules, quizzes, enrollment count
- **PATCH**: creator or super_admin can update
- **DELETE**: super_admin only

```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Fetch course with modules, quizzes, enrollment count
  // If participant: must be enrolled OR course must be published
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  // Update course - creator or super_admin only
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Delete course - super_admin only
}
```

### 3. Update `app/api/elearning/courses/[id]/modules/route.ts` — CRUD

```typescript
// POST: create module (video URL or text content, order)
// PATCH/DELETE: creator or super_admin
```

### 4. Update `app/api/elearning/courses/[id]/quizzes/route.ts` — CRUD

```typescript
// POST: create quiz (questions array with options)
// NEVER send correct answers to client - compare server-side only
// Store correct answers in server-only field, never return to client
```

### 5. Update `app/api/elearning/courses/[id]/enroll/route.ts` — POST

```typescript
// Auth: participant
// Course must be published
// Check not already enrolled
// Insert elearning_enrollments; initialize elearning_progress for all modules
// Send elearning-enrolled email
```

### 6. Update `app/api/elearning/courses/[id]/progress/route.ts` — POST

```typescript
// Auth: enrolled participant only
// Input: { moduleId: string, completed: boolean }
// Update elearning_progress
// Calculate overall progress percentage
// Return { progress, completedModules, totalModules }
```

### 7. Update `app/api/elearning/courses/[id]/quiz/submit/route.ts` — POST

```typescript
// Auth: enrolled participant
// Input: { answers: { questionId: string, answer: string }[] }
// Calculate score server-side - NEVER expose correct answers
// Store in elearning_submissions
// Return { score, total, passed }
// If passed all quizzes + all modules complete -> trigger certificate
```

### 8. Update `app/api/super-admin/elearning/courses/[id]/approve/route.ts`

```typescript
// Auth: super_admin only
// Transition: pending_publish → published
// Return { courseId, status }
```

### 9. Update `app/api/super-admin/elearning/courses/[id]/reject/route.ts`

```typescript
// Auth: super_admin only
// Transition: pending_publish → draft
// Input: { reason: string }
// Log to audit
```

### 5b. Certificates

### 10. Update `app/api/certificates/generate/route.ts`

```typescript
// Auth: automatic (system) or super_admin
// Trigger: course completion (all modules + quizzes passed)
// Generate certificate: { userId, courseId, issuedAt, certificateNumber }
// Format: TCoEFS-{YEAR}-{SEQUENTIAL_ID} - use DB sequence or FOR UPDATE lock
// Send certificate-issued email
// Return { certificateId, certificateNumber }
```

### 11. Update `app/api/certificates/[id]/route.ts`

```typescript
// Auth: certificate owner or super_admin
// Return certificate with course name and user profile
```

### 12. Update `app/api/certificates/verify/[certificateNumber]/route.ts`

```typescript
// No auth (public endpoint)
// Return: { valid: boolean, holderName, courseName, issuedAt } or { valid: false }
// This endpoint can be public - used by employers to verify
```

### 5c. Wire Up Frontend Pages

- `app/(dashboard)/elearning/dashboard/page.tsx` → GET /api/elearning/courses?myCourses=true
- `app/(dashboard)/elearning/courses/page.tsx` → GET /api/elearning/courses (published)
- `app/(dashboard)/elearning/course/[courseId]/page.tsx` → GET /api/elearning/courses/[id]
- `app/(dashboard)/elearning/course/[courseId]/module/[moduleId]/page.tsx` → GET module, POST progress
- `app/(dashboard)/elearning/course/[courseId]/quiz/page.tsx` → GET quiz, POST submit
- `app/(dashboard)/elearning/certificates/page.tsx` → GET /api/certificates (own)
- `app/(dashboard)/admin/elearning/page.tsx` → GET /api/elearning/courses (all)
- `app/(dashboard)/admin/elearning/courses/page.tsx` → GET /api/elearning/courses (admin)
- `app/(dashboard)/super-admin/elearning/page.tsx` → GET /api/elearning/courses (all)

## Key Business Rules (Non-Negotiable)

- **Nothing visible/enrollable until super_admin approves** — published status is gate for all participant-facing e-learning
- Certificate number generation must be atomic (use DB sequence or FOR UPDATE lock)
- Quiz correct answers must NEVER be sent to the client
- Progress must be recalculated on every update

## 🚨 USER ACTION REQUIRED

- [ ] No additional setup needed — uses existing Supabase + database

## Verification

- Enroll in course → appears in my learning
- Complete all modules + pass quizzes → certificate auto-generated
- Verify certificate at public endpoint → returns valid details

---

Now implement Phase 5 and create the e-learning/certificate API routes and wire up frontend pages.