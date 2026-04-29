# Supabase + Resend API Setup (No Supabase SMTP)

Use Supabase Auth for users/tokens, but send transactional emails directly from app server via Resend API.

## 1) Environment variables

Ensure these are set in your app environment:

- `RESEND_API_KEY`
- `RESEND_FROM_ADDRESS`

No hook secret is needed for this approach.

## 2) Supabase Dashboard setup (no SQL required)

1. Open `Authentication` -> `SMTP Settings`
2. Disable custom SMTP (or leave Supabase default)
3. Keep auth enabled for email/password users

Email delivery is handled by app code through Resend API.

## 3) Optional: Auth URL checks

In Supabase `Authentication` -> `URL Configuration`:

- Site URL: `https://portal.tcoefs-unijos.org`
- Add redirect URL: `https://portal.tcoefs-unijos.org/api/auth/callback`

For local dev, also allow:

- `https://<your-tunnel-domain>/api/auth/callback`

## 4) Local testing

You only need your app callback URL allowed in Supabase.

Example local env values:

```ini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_...
RESEND_FROM_ADDRESS=noreply@portal.tcoefs-unijos.org
```

In Supabase `Authentication` -> `URL Configuration`, add:

- `http://localhost:3000/api/auth/callback`

## 5) SQL required

No SQL migration is required for this change.

The hook integration is configured in Supabase Auth settings, not database tables.
