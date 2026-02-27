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

## Next steps

1. Replace manual ID input with proper pickers/selectors
2. Add Stripe deposits + reminder jobs
3. Add update/delete flows for clients/services/appointments
4. Implement dynamic niche forms from `niche_configs`
