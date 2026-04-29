# Phase 4 — Applications + Training Domain

## Agent Prompt

```
You are a veteran senior backend engineer from a FAANG company with 15+ years of experience building scalable, secure, production-grade systems. You have deep expertise in:

- Next.js App Router API routes with proper error handling and validation
- Supabase (Auth, Database, Storage, Edge Functions)
- TypeScript type safety and clean architecture
- Zod validation

Read the instructions below carefully, then plan and implement the deliverables.

## Prerequisites

- Phases 0–3 complete
- All existing frontend pages in `app/(dashboard)/admin/**` and `app/(dashboard)/super-admin/**` exist with mock data
- Database schema has applications, training_programs tables

## Your Task

Implement all application and training programme CRUD operations, status transitions, and admin management endpoints. Wire up frontend pages to fetch real data.

## Deliverables

### 4a. Applications

### 1. Update `app/api/applications/route.ts` — POST (Submit Application)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/resend'

const applicationSchema = z.object({
  programmeId: z.string().uuid(),
  personalStatement: z.string().min(50).max(2000),
  documentIds: z.array(z.string().uuid()).default([]),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { programmeId, personalStatement, documentIds } = applicationSchema.parse(body)

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify programme exists and is published
    const { data: programme } = await supabase
      .from('training_programs')
      .select('id, title')
      .eq('id', programmeId)
      .eq('status', 'published')
      .single()

    if (!programme) {
      return NextResponse.json({ error: 'Programme not found or not published' }, { status: 400 })
    }

    // Check user doesn't already have pending/approved application for this programme
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('programme_id', programmeId)
      .in('status', ['pending', 'review', 'approved'])
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You already have an active application for this programme' }, { status: 400 })
    }

    // Insert application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        user_id: session.user.id,
        programme_id: programmeId,
        personal_statement: personalStatement,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Link documents if provided
    if (documentIds.length > 0) {
      await supabase
        .from('application_documents')
        .update({ application_id: application.id })
        .in('id', documentIds)
    }

    // Send confirmation email
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', session.user.id)
      .single()

    await sendEmail({
      to: session.user.email!,
      template: 'application-submitted',
      data: { name: `${profile?.first_name} ${profile?.last_name}`, programme: programme.title },
    })

    return NextResponse.json({ applicationId: application.id, status: application.status })
  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
```

### 2. Update `app/api/applications/[id]/route.ts` — GET & PATCH

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/resend'

// GET - fetch application
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const isAdmin = ['super_admin', 'training_coordinator', 'admissions_officer'].includes(profile?.role || '')

    // Fetch application
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        programme:training_programs(title, slug, schedule, venue, fees),
        documents:application_documents(id, document_type, file_path, uploaded_at)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Check access
    if (!isAdmin && application.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}

// PATCH - update status
const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'review', 'approved', 'rejected']),
  adminFeedback: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!['super_admin', 'training_coordinator'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, adminFeedback } = statusUpdateSchema.parse(body)
    const { id } = params

    const { data: application, error } = await supabase
      .from('applications')
      .update({
        status,
        admin_feedback: adminFeedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Send email notification
    const { data: user } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', application.user_id)
      .single()

    const template = status === 'approved' ? 'application-approved' 
      : status === 'rejected' ? 'application-rejected' 
      : null

    if (template && user?.email) {
      await sendEmail({
        to: user.email,
        template,
        data: { feedback: adminFeedback },
      })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}
```

### 3. Update `app/api/admin/applications/route.ts` — GET (Admin List)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const listSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  programmeId: z.string().uuid().optional(),
})

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!['super_admin', 'training_coordinator', 'admissions_officer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const { page, pageSize, status, programmeId } = listSchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      status: searchParams.get('status'),
      programmeId: searchParams.get('programmeId'),
    })

    const offset = (page - 1) * pageSize

    let query = supabase
      .from('applications')
      .select(`
        *,
        programme:training_programs(id, title),
        user:profiles(first_name, last_name, email)
      `, { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (programmeId) query = query.eq('programme_id', programmeId)

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('List applications error:', error)
    return NextResponse.json({ error: 'Failed to list applications' }, { status: 500 })
  }
}
```

### 4b. Training Programmes

### 4. Update `app/api/training/route.ts` — POST (Create)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const trainingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  schedule: z.string().optional(),
  venue: z.string().optional(),
  capacity: z.number().int().positive().default(50),
  fees: z.number().nonnegative().default(0),
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

    if (!['super_admin', 'training_coordinator'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = trainingSchema.parse(body)

    // Generate slug
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: programme, error } = await supabase
      .from('training_programs')
      .insert({
        ...data,
        slug,
        status: 'draft',
        creator_id: session.user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ programmeId: programme.id })
  } catch (error) {
    console.error('Create training error:', error)
    return NextResponse.json({ error: 'Failed to create training programme' }, { status: 500 })
  }
}

// GET - list training programmes
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('training_programs')
      .select(`
        *,
        creator:profiles(first_name, last_name),
        _count:training_applications(count)
      `)

    if (status) query = query.eq('status', status)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('List training error:', error)
    return NextResponse.json({ error: 'Failed to list training programmes' }, { status: 500 })
  }
}
```

### 5. Update `app/api/training/[id]/route.ts` — CRUD

```typescript
// GET, PATCH, DELETE for single training programme
// Implement with proper authorization checks
// PATCH: creator or super_admin can update draft/pending; super_admin can update any
// DELETE: super_admin only (soft delete - set status cancelled)
```

### 6. Update `app/api/training/[id]/publish/route.ts` — POST (Request Publish)

```typescript
// Auth: training_coordinator (creator only)
// Transition: draft → pending_publish
// Notify super_admin via audit log
```

### 7. Update `app/api/super-admin/training/[id]/approve/route.ts` — POST

```typescript
// Auth: super_admin only
// Transition: pending_publish → published
// Return { programmeId, status }
```

### 8. Update `app/api/super-admin/training/[id]/reject/route.ts` — POST

```typescript
// Auth: super_admin only
// Transition: pending_publish → draft
// Input: { reason: string }
// Log to audit
```

### 4c. Wire Up Frontend Pages

- `app/(dashboard)/admin/applications/page.tsx` → GET /api/admin/applications
- `app/(dashboard)/admin/applications/[id]/page.tsx` → GET /api/applications/[id]
- `app/(dashboard)/admin/training/page.tsx` → GET /api/training
- `app/(dashboard)/super-admin/applications/page.tsx` → GET /api/admin/applications
- `app/(dashboard)/super-admin/training/page.tsx` → GET /api/training
- `app/(dashboard)/applicant/documents/page.tsx` → GET /api/applications (own)

## Key Business Rules (Non-Negotiable)

- **Creator = Coordinator**: training programme creator is auto-assigned; no manual assignment
- Application status `approved` does NOT automatically register a participant
- Slot/enrollment counts must be calculated server-side
- All status transitions must be validated (no invalid transitions)

## 🚨 USER ACTION REQUIRED

- [ ] No additional setup needed — uses existing Supabase + database

## Verification

- Create application → appears in admin dashboard with pending status
- Approve application → applicant receives email, status updates
- Publish training → visible to participants on public page

---

Now implement Phase 4 and create the application/training API routes and wire up frontend pages.