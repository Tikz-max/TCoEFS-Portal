# Phase 6 — Admin APIs + Reports + Audit + Email + Hooks

## Agent Prompt

```
You are a veteran senior backend engineer from a FAANG company with 15+ years of experience building scalable, secure, production-grade systems. You have deep expertise in:

- Next.js App Router API routes with proper error handling and validation
- Supabase (Auth, Database, Storage, Edge Functions)
- TypeScript type safety and clean architecture
- Zod validation

Read the instructions below carefully, then plan and implement the deliverables.

## Prerequisites

- Phases 0–5 complete
- All admin pages in `app/(dashboard)/admin/**` and `app/(dashboard)/super-admin/**` exist
- Email templates in `src/emails/*.tsx` exist (currently empty)

## Your Task

Complete all remaining backend infrastructure: admin management, reporting, audit log retrieval, email queue, and shared hooks. Wire up all remaining frontend pages.

## Deliverables

### 6a. Admin & Role Management

### 1. Update `app/api/super-admin/users/route.ts` — GET

```typescript
// GET: list all users with role, pagination
// Auth: super_admin
// Return: { data: profiles[], total, page, pageSize }
```

### 2. Update `app/api/super-admin/users/[id]/route.ts` — PATCH

```typescript
// PATCH: update user role (except super_admin self-demotion), suspend/activate
// Auth: super_admin
// Input: { role?: string, status?: 'active' | 'suspended' }
```

### 3. Update `app/api/super-admin/roles/route.ts` — GET & POST

```typescript
// GET: list roles
// POST: create custom role (non-system only)
// Auth: super_admin
```

### 4. Update `app/api/super-admin/roles/[id]/route.ts` — PATCH & DELETE

```typescript
// PATCH: update role permissions
// DELETE: delete custom role (only if no users assigned)
// Auth: super_admin
```

### 6b. Reports

### 5. Update `app/api/admin/reports/applications/route.ts`

```typescript
// GET: applications report with filters (date range, programme, status)
// Auth: admissions_officer, training_coordinator, super_admin
// Return: { 
//   total: number,
//   byStatus: { status: string, count: number }[],
//   byProgramme: { programme: string, count: number }[],
//   trend: { month: string, count: number }[]
// }
```

### 6. Update `app/api/admin/reports/training/route.ts`

```typescript
// GET: training report
// Return: {
//   programmes: { id, title, status, capacity, enrolled }[],
//   enrollmentCount: number,
//   revenue: { programme: string, amount: number }[],
//   completionRate: number
// }
```

### 7. Update `app/api/admin/reports/payments/route.ts`

```typescript
// GET: payment report
// Return: {
//   totalCollected: number,
//   byStatus: { status: string, count: number, amount: number }[],
//   byProgramme: { programme: string, amount: number }[],
//   monthlyTrend: { month: string, amount: number }[]
// }
```

### 8. Update `app/api/admin/reports/elearning/route.ts`

```typescript
// GET: e-learning report
// Return: {
//   courses: { id, title, status, enrolled, completed }[],
//   enrollmentCount: number,
//   completionRate: number,
//   popularCourses: { course: string, enrollments: number }[]
// }
```

### 6c. Audit Log

### 9. Update `app/api/admin/audit/route.ts`

```typescript
// GET: paginated audit entries with filters (action, actor, table, date range)
// Auth: training_coordinator, admissions_officer, super_admin
// Return: { data: audit_log[], total, page, pageSize }
```

### 10. Update `app/api/super-admin/audit/route.ts`

```typescript
// GET: all audit entries (super_admin only)
// Support CSV export via ?format=csv
// Return: { data: audit_log[], total, page, pageSize }
```

### 6d. Email Templates

### 11. Implement all 9 email templates in `src/emails/*.tsx`:

**application-submitted.tsx**
```tsx
// Applicant confirmation after submitting application
// Show: programme name, submission date, next steps
```

**application-approved.tsx**
```tsx
// Acceptance notification
// Show: programme name, welcome message, next steps
```

**application-rejected.tsx**
```tsx
// Rejection with optional admin feedback
// Show: programme name, reason if provided, contact for questions
```

**payment-reference.tsx**
```tsx
// RRR and payment instructions (DEPRECATED - see remita_refactor.md)
// Show: RRR number, amount, payment deadline, payment link
```

**payment-verified.tsx**
```tsx
// Successful payment confirmation
// Show: amount, payment date, programme name
```

**training-confirmed.tsx**
```tsx
// Training enrollment confirmation
// Show: training name, date, venue, what to bring
```

**elearning-enrolled.tsx**
```tsx
// Course enrollment confirmation
// Show: course name, start learning button, expected duration
```

**certificate-issued.tsx**
```tsx
// Certificate with download link
// Show: certificate number, course name, download button
```

**account-created.tsx**
```tsx
// New user welcome
// Show: login credentials, verify email link, getting started
```

### 12. Update `app/api/email/route.ts`

```typescript
// POST: send transactional email
// Auth: system only (internal) - check via service role key or internal header
// Input: { to: string, template: string, data: Record<string, unknown> }
// Render template with data; send via resend.ts
// Log to email_queue table for retry on failure
// Return: { sent: boolean, messageId?: string }
```

### 6e. Shared Hooks

### 13. Finalize `src/hooks/use-user.ts`

Full implementation:
```typescript
// Already implemented in Phase 2, ensure completeness:
// - Fetch current user profile + role from Supabase
// - hasRole(roles: string[]) helper
// - signOut() method
// - loading/error states
```

### 14. Finalize `src/hooks/use-toast.ts`

```typescript
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
```

### 15. Finalize `src/hooks/use-upload.ts`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface UploadOptions {
  purpose: 'application_document' | 'course_material' | 'profile_photo'
  relatedId?: string
}

export function useUpload() {
  const supabase = createClientComponentClient()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, options: UploadOptions) => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Get presigned URL
      const { data: presignData, error: presignError } = await supabase.rpc(
        'get_presigned_upload_url',
        {
          p_filename: file.name,
          p_content_type: file.type,
          p_purpose: options.purpose,
        }
      )

      if (presignError) throw presignError

      // Upload to R2
      const xhr = new XMLHttpRequest()
      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress((e.loaded / e.total) * 100)
        })
        xhr.addEventListener('load', resolve)
        xhr.addEventListener('error', reject)
        xhr.open('PUT', presignData.uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      // Confirm upload
      const { data: confirmData, error: confirmError } = await supabase.rpc(
        'confirm_upload',
        {
          p_object_key: presignData.objectKey,
          p_purpose: options.purpose,
          p_related_id: options.relatedId,
        }
      )

      if (confirmError) throw confirmError

      return { url: confirmData.url }
    } catch (e: any) {
      setError(e.message || 'Upload failed')
      throw e
    } finally {
      setIsUploading(false)
    }
  }, [supabase])

  return { upload, isUploading, progress, error }
}
```

### 6f. Wire Up Remaining Frontend Pages

- `app/(dashboard)/admin/payments/page.tsx` → GET /api/payments (admin filter)
- `app/(dashboard)/admin/reports/page.tsx` → GET /api/admin/reports/*
- `app/(dashboard)/admin/audit/page.tsx` → GET /api/admin/audit
- `app/(dashboard)/super-admin/users/page.tsx` → GET /api/super-admin/users
- `app/(dashboard)/super-admin/roles/page.tsx` → GET /api/super-admin/roles
- `app/(dashboard)/super-admin/audit-log/page.tsx` → GET /api/super-admin/audit
- `app/(dashboard)/super-admin/payments/page.tsx` → GET /api/payments (all)
- `app/(dashboard)/super-admin/reports/page.tsx` → GET /api/admin/reports/* (all)

## Key Business Rules (Non-Negotiable)

- All report endpoints must be paginated (default 20, max 100 per page)
- Audit log insert must happen AFTER successful DB commit (not in same transaction)
- Email sending must be fire-and-forget with email_queue fallback
- Role deletion must check for assigned users before allowing delete

## 🚨 USER ACTION REQUIRED

- [ ] Set up Resend account at https://resend.com
- [ ] Get API key from Resend dashboard
- [ ] Add to `.env.local`:
  ```
  RESEND_API_KEY=re_xxxxxxxxxxxx
  ```
- [ ] Verify sender email in Resend (add domain or use onboarding@resend.dev for testing)

## Verification

- All admin pages show real data from database
- Reports generate accurate statistics
- Audit log captures all status-changing actions
- Emails send on key actions (application, payment, certificate)
- All pages pass `npm run lint` and `npm run typecheck`

---

Now implement Phase 6 and complete the final backend infrastructure. After this, the entire Phase 8 backend is complete.

## Final Verification Commands

Run from `portal/` directory:

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build (optional)
npm run build
```

All must pass with zero errors.