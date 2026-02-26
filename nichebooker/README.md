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

## Next steps

1. Wire Auth and workspace bootstrap
2. Build clients/services/appointments CRUD
3. Add Stripe deposits + reminder jobs
4. Implement niche config loader and dynamic form rendering
