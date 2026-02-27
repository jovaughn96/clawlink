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

## Next steps

1. Replace quick chip selectors with searchable dropdowns
2. Build proper edit forms (not just delete)
3. Add reminder scheduler (24h / 2h) + delivery logs
4. Implement dynamic niche forms from `niche_configs`
5. Add Stripe customer/payment method reuse and receipts
