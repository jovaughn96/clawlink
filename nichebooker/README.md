# NicheBooker (Expo + Supabase scaffold)

Multi-niche booking + CRM starter for iOS.

## Quick start

```bash
cp .env.example .env
npm install
npm run ios
```

## Environment

Set in `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Supabase

Run migration in `supabase/migrations/0001_init.sql`.

## Current scaffold

- Core domain types (`src/types`)
- Supabase client (`src/lib/supabase.ts`)
- Niche config example (`src/niches/lash-tech.ts`)
- Placeholder feature screens
- Initial SQL schema

## Implemented in Phase 2

- Email/password auth gate (sign in or sign up)
- Workspace bootstrap per signed-in user
- Clients CRUD (create + list)
- Services CRUD (create + list)
- Appointment creation + upcoming list
- SQL migration for `workspace_users`, RLS policies, and niche config seed

## Implemented in Phase 3

- Appointment client/service quick selectors (chips) instead of raw ID-only flow
- Delete actions for clients/services/appointments
- Stripe deposit intent client call scaffold (`createDepositIntent`)
- Supabase Edge Function scaffolds:
  - `supabase/functions/create-deposit-intent/index.ts`
  - `supabase/functions/stripe-webhook/index.ts`

## Implemented in Phase 5

- `send-reminders` now attempts real delivery:
  - SMS via Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`)
  - Email fallback via Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
- Reminder jobs auto-upsert on appointment create (and through shared update helper)
- Lightweight in-app **Reminders** tab to inspect scheduled jobs + recent message logs

## Next steps

1. Add reminder cancellation/rebuild when appointments are cancelled/rescheduled in UI
2. Implement dynamic niche forms from `niche_configs`
3. Add Stripe customer/payment method reuse and receipts
4. Add robust provider retry/backoff + dead-letter flow for reminders
