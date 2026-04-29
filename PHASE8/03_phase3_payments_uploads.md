# Phase 3 — Payments + Webhook + Uploads

> **DEPRECATED** — See `remita_refactor.md` for the current manual bank transfer implementation.
> 
> This phase previously documented the Remita payment flow which has been replaced.

## Agent Prompt

```
You are a veteran senior backend engineer from a FAANG company with 15+ years of experience building scalable, secure, production-grade systems. You have deep expertise in:

- Next.js App Router API routes with proper error handling and validation
- Supabase (Auth, Database, Storage, Edge Functions)
- Payment integration (Remita/RRR)
- Cloud storage (R2/S3 presigned URLs)
- Zod validation, security best practices

Read the instructions below carefully, then plan and implement the deliverables.

## Prerequisites

- Phases 0–2 complete
- `src/lib/payment/remita.ts` exists with RRR generation and verification
- `src/lib/storage/r2.ts` and `src/lib/storage/upload.ts` exist
- Database schema has `payments` and `application_documents` tables

## Your Task

Implement the full Remita payment flow (RRR generation, status verification, webhook processing) and file upload pipeline using R2/S3 presigned URLs.

## Deliverables

### 3a. Payments

### 1. Update `app/api/payments/generate-rrr/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateRRR } from '@/lib/payment/remita'
import { sendEmail } from '@/lib/email/resend'

const generateRRRSchema = z.object({
  amount: z.number().positive(),
  programmeId: z.string().uuid(),
  applicantEmail: z.string().email(),
  applicantName: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, programmeId, applicantEmail, applicantName } = generateRRRSchema.parse(body)

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate RRR
    const rrr = await generateRRR({
      amount,
      email: applicantEmail,
      name: applicantName,
      merchantId: process.env.REMITA_MERCHANT_ID!,
      serviceTypeId: process.env.REMITA_SERVICE_TYPE_ID!,
      apiKey: process.env.REMITA_API_KEY!,
      apiToken: process.env.REMITA_API_TOKEN!,
      environment: process.env.REMITA_ENVIRONMENT!,
    })

    // Insert payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: session.user.id,
        rrr: rrr.RRR,
        amount,
        status: 'pending',
        programme_id: programmeId,
      })
      .select()
      .single()

    if (error) throw error

    // Send RRR via email
    await sendEmail({
      to: applicantEmail,
      template: 'payment-reference',
      data: { rrr: rrr.RRR, amount, name: applicantName },
    })

    return NextResponse.json({
      rrr: rrr.RRR,
      amount,
      expiry: rrr.expiry,
    })
  } catch (error) {
    console.error('Generate RRR error:', error)
    return NextResponse.json({ error: 'Failed to generate RRR' }, { status: 500 })
  }
}
```

### 2. Update `app/api/payments/verify/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkPaymentStatus } from '@/lib/payment/remita'

const verifySchema = z.object({
  rrr: z.string().min(10),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rrr } = verifySchema.parse(body)

    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check payment status via Remita
    const status = await checkPaymentStatus(rrr, {
      merchantId: process.env.REMITA_MERCHANT_ID!,
      apiKey: process.env.REMITA_API_KEY!,
      apiToken: process.env.REMITA_API_TOKEN!,
      environment: process.env.REMITA_ENVIRONMENT!,
    })

    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: status.status,
        payment_date: status.paymentDate,
        updated_at: new Date().toISOString(),
      })
      .eq('rrr', rrr)

    if (updateError) throw updateError

    // If successful, update application status to review
    if (status.status === 'successful') {
      const { data: payment } = await supabase
        .from('payments')
        .select('programme_id')
        .eq('rrr', rrr)
        .single()

      if (payment?.programme_id) {
        await supabase
          .from('applications')
          .update({ status: 'review', updated_at: new Date().toISOString() })
          .eq('user_id', session.user.id)
          .eq('programme_id', payment.programme_id)
      }
    }

    return NextResponse.json({
      status: status.status,
      amount: status.amount,
      date: status.paymentDate,
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
```

### 3. Update `app/api/payments/webhook/route.ts` (AUTHORITATIVE)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/payment/remita'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-remita-signature')
    const body = await request.text()

    // Verify signature safely
    let isValid = false
    if (signature && signature.length === 64) {
      try {
        isValid = await verifyWebhookSignature(body, signature, process.env.REMITA_API_KEY!)
      } catch (e) {
        console.error('Signature verification error:', e)
        isValid = false
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { RRR, status, amount, paymentDate } = payload

    const supabase = createRouteHandlerClient({ cookies })

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status,
        payment_date: paymentDate,
        updated_at: new Date().toISOString(),
      })
      .eq('rrr', RRR)

    if (updateError) {
      console.error('Payment update error:', updateError)
    }

    // If successful, create/update training application
    if (status === 'successful') {
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id, programme_id')
        .eq('rrr', RRR)
        .single()

      if (payment) {
        // Insert or update training application
        await supabase
          .from('training_applications')
          .upsert({
            training_id: payment.programme_id,
            user_id: payment.user_id,
            status: 'enrolled',
            enrolled_at: new Date().toISOString(),
          }, {
            onConflict: 'training_id,user_id',
          })
      }
    }

    // Insert audit log
    await supabase.from('audit_log').insert({
      user_id: payment?.user_id,
      action: 'payment',
      table_name: 'payments',
      record_id: RRR,
      new_values: { status, amount },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

### 3b. Uploads

### 4. Update `app/api/uploads/presign/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generatePresignedPutUrl } from '@/lib/storage/upload'

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string(),
  purpose: z.enum(['application_document', 'course_material', 'profile_photo']),
})

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filename, contentType, purpose } = presignSchema.parse(body)

    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const allowedRoles = ['super_admin', 'training_coordinator', 'instructor', 'participant']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate presigned URL
    const { uploadUrl, objectKey } = await generatePresignedPutUrl({
      filename,
      contentType,
      purpose,
      userId: session.user.id,
    })

    return NextResponse.json({ uploadUrl, objectKey })
  } catch (error) {
    console.error('Presign error:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
```

### 5. Update `app/api/uploads/confirm/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSignedUrl, headObject } from '@/lib/storage/r2'

const confirmSchema = z.object({
  objectKey: z.string().min(1),
  purpose: z.enum(['application_document', 'course_material', 'profile_photo']),
  relatedId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { objectKey, purpose, relatedId } = confirmSchema.parse(body)

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify object exists
    const exists = await headObject(objectKey)
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get public URL
    const url = await getSignedUrl(objectKey)

    // If application_document, insert into database
    if (purpose === 'application_document' && relatedId) {
      await supabase.from('application_documents').insert({
        application_id: relatedId,
        document_type: 'upload',
        file_path: objectKey,
      })
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Confirm upload error:', error)
    return NextResponse.json({ error: 'Failed to confirm upload' }, { status: 500 })
  }
}
```

## Key Business Rules (Non-Negotiable)

- **Webhook-first payment flow**: webhook is authoritative; admin override only for edge cases with super_admin + reason
- `verifyWebhookSignature` helper can crash on malformed hash — wrap in try/catch, validate hash length
- Presigned URLs must expire in ≤ 15 minutes
- All uploaded files must be validated server-side (not just client)

## 🚨 USER ACTION REQUIRED

- [ ] Set up Remita account at https://remita.net
- [ ] Get API credentials: Merchant ID, API Key, API Token, Service Type ID
- [ ] Configure Remita webhook URL in dashboard: `https://your-app.com/api/payments/webhook`
- [ ] Add to `.env.local`:
  ```
  REMITA_MERCHANT_ID=your-merchant-id
  REMITA_API_KEY=your-api-key
  REMITA_API_TOKEN=your-api-token
  REMITA_SERVICE_TYPE_ID=your-service-type-id
  REMITA_ENVIRONMENT=staging
  ```
- [ ] Set up R2 bucket at Cloudflare (or S3)
- [ ] Add to `.env.local`:
  ```
  R2_ACCOUNT_ID=your-account-id
  R2_ACCESS_KEY_ID=your-access-key
  R2_SECRET_ACCESS_KEY=your-secret
  R2_BUCKET_NAME=tcoefs-uploads
  R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
  ```

## Verification

- Generate RRR → appears in dashboard with payment link
- Payment via Remita → webhook updates status automatically
- Upload file → returns presigned URL → confirm stores in DB

---

Now implement Phase 3 and create the payment/upload API routes.