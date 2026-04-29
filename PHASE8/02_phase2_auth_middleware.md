# Phase 2 — Auth + Middleware + Session Guards

## Agent Prompt

```
You are a veteran senior backend engineer from a FAANG company with 15+ years of experience building scalable, secure, production-grade systems. You have deep expertise in:

- Next.js App Router API routes with proper error handling and validation
- Supabase (Auth, Database, Storage, Edge Functions)
- TypeScript type safety and clean architecture

Read the instructions below carefully, then plan and implement the deliverables.

## Prerequisites

- Phase 1 complete: database schema exists, RLS policies set
- `src/lib/supabase/middleware.ts` exists (currently empty)
- `.env.local` has Supabase credentials

## Your Task

Wire up Supabase Auth, protect routes with role-based middleware, and create server-side session helpers. Also wire up existing frontend pages to fetch real data instead of mock.

## Deliverables

### 1. Update `src/lib/supabase/middleware.ts`

Full RBAC middleware that:
- Extracts Supabase auth session from cookies (`sb-access-token`, `sb-refresh-token`)
- Returns 401 if no valid session
- Attaches `user` and `role` to request headers for downstream use
- Allows paths without auth: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/api/auth/*`, `/api/webhooks/*`, `/public/*`
- Protects `/api/*` with auth check
- Implements role guards per route pattern:
  - `/api/admin/*` → training_coordinator OR admissions_officer OR super_admin
  - `/api/super-admin/*` → super_admin only
  - `/api/payments/generate-rrr` → participant or applicant with pending application
- Returns 403 on role mismatch
- Never throws — always returns NextResponse

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/public']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // API routes need auth
  if (pathname.startsWith('/api/')) {
    // Skip webhook and auth callback
    if (pathname.includes('/webhook') || pathname.includes('/auth/')) {
      return response
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const userRole = profile?.role || 'participant'

    // Role-based access control
    if (pathname.startsWith('/api/super-admin/')) {
      if (userRole !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (pathname.startsWith('/api/admin/')) {
      if (!['super_admin', 'training_coordinator', 'admissions_officer'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Attach user info to headers
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-role', userRole)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2. Update `src/hooks/use-user.ts`

Browser hook returning current user profile + role from Supabase client:

```typescript
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  role: string
  location?: string
  phone?: string
}

export function useUser() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      setUser(profile)
      setLoading(false)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return { user, loading, hasRole, signOut }
}
```

### 3. Update `app/api/auth/callback/route.ts`

Handle Supabase auth callback with session creation and cookie setting.

### 4. Update Login/Register pages to use real auth

- `app/(auth)/login/page.tsx` — wire up Supabase signInWithPassword:
  
  Replace mock `handleSubmit` with:
  ```typescript
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setHasError(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      setIsLoading(false)
      setHasError(true)
      return
    }

    // Get user role and redirect accordingly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    const role = profile?.role || 'participant'
    const redirectPath = role === 'super_admin' ? '/super-admin/dashboard' 
      : role === 'training_coordinator' || role === 'admissions_officer' || role === 'instructor' 
      ? '/admin/dashboard' 
      : '/elearning/dashboard'

    router.push(redirectPath)
    router.refresh()
  }
  ```

- `app/(auth)/register/page.tsx` — wire up Supabase signUp with profile creation.

### 5. Update existing dashboard pages to fetch real data

Replace mock data with Supabase queries:

- `app/(dashboard)/elearning/dashboard/page.tsx` — query elearning_enrollments + elearning_progress
- `app/(dashboard)/training/dashboard/page.tsx` — query training_applications
- `app/(dashboard)/applicant/dashboard/page.tsx` — query applications + payments
- `app/(dashboard)/admin/dashboard/page.tsx` — query counts for stats

## Key Business Rules (Non-Negotiable)

- Never store plain passwords or secrets in middleware
- Middleware must not throw — always return NextResponse
- Session refresh must handle concurrent refresh race conditions

## 🚨 USER ACTION REQUIRED

- [ ] Ensure Supabase Auth is enabled in Supabase dashboard (Authentication → Settings)
- [ ] Configure redirect URLs in Supabase: `http://localhost:3000/api/auth/callback`
- [ ] Test login at http://localhost:3000/login with seeded users (or create new account)

## Verification

- Login with user → redirects to correct dashboard based on role
- Invalid role → receives 403
- Unauthenticated → receives 401
- Dashboard shows real data from database

---

Now implement Phase 2 and wire up authentication.