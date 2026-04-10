# Totally Legit Sportsbook (Parody)

Vite + React + Supabase frontend-only prediction market app.

## Setup

1. Install deps:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run app:
   ```bash
   npm run dev
   ```

## Suggested Supabase tables

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false
);

create table markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  lock_time timestamptz not null,
  resolved_option_id uuid null,
  created_at timestamptz not null default now()
);

create table market_options (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  label text not null
);

alter table markets
  add constraint fk_resolved_option
  foreign key (resolved_option_id)
  references market_options(id);

create table picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_id uuid not null references markets(id) on delete cascade,
  option_id uuid not null references market_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, market_id)
);
```

Configure RLS policies so authenticated users can read/write according to your app rules.
