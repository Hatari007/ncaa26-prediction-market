codex/add-github-actions-workflow-for-pages
# NCAA26 Prediction Market

This repository is configured to deploy a Vite static site to **GitHub Pages** using GitHub Actions.

## Deployment workflow

The workflow file is at:

- `.github/workflows/deploy.yml`

It runs on pushes to `main`, installs dependencies with `npm ci`, builds with `npm run build`, and deploys the generated `dist/` folder to GitHub Pages.

## Required GitHub Pages settings (exact UI steps)

In your GitHub repository:

1. Go to **Settings**.
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions**.
4. Save if prompted.

After that, each push to `main` will trigger deployment via the workflow.
codex/implement-core-product-features
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
codex/add-supabase-integration-to-vite-react-app
# NCAA26 Prediction Market (Vite + React + Supabase)

This starter uses Supabase Auth magic links and a basic display-name profile flow for a private friend-group site.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

Required variables:
codex/document-project-rules-for-ncaa-site
# NCAA 26 Dynasty Prediction Market (Parody)

Private friend-group NCAA 26 dynasty prediction market site.

**Entertainment only** This project is a parody game for fun among friends. It does **not** support real-money gambling or payouts.

## Tech stack

- Static frontend (HTML/CSS/vanilla JS)
- Supabase backend (Auth + Postgres)
- GitHub Pages deployment
- Minimal dependencies (Supabase JS via CDN)

## Features

- Email/password authentication before picks
- One pick per user per market (enforced by DB unique constraint + upsert)
- Market states: `open`, `locked`, `resolved`
- Admin tools for create/edit/resolve markets
- Leaderboard based on correct picks
- Mobile-responsive UI

## Local setup

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd ncaa26-prediction-market
   ```
2. Create `config.js` from `config.example.js` and fill in your Supabase values:
   ```bash
   cp config.example.js config.js
   ```
3. Serve locally (any static server):
   ```bash
   python3 -m http.server 4173
   ```
4. Open: `http://localhost:4173`

## Supabase setup

### 1) Create tables

Run this SQL in the Supabase SQL editor:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.markets (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  option_a text not null,
  option_b text not null,
  status text not null check (status in ('open','locked','resolved')) default 'open',
  correct_option text check (correct_option in ('A','B')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.picks (
  id bigint generated always as identity primary key,
  market_id bigint not null references public.markets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pick text not null check (pick in ('A','B')),
  created_at timestamptz not null default now(),
  unique (market_id, user_id)
);
```

### 2) Enable RLS and policies

```sql
alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.picks enable row level security;

-- Profiles
create policy "profiles are viewable by authenticated users"
on public.profiles for select
using (auth.role() = 'authenticated');

create policy "users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Markets
create policy "authenticated users can view markets"
on public.markets for select
using (auth.role() = 'authenticated');

create policy "admins can insert markets"
on public.markets for insert
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  )
);

create policy "admins can update markets"
on public.markets for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  )
);

-- Picks
create policy "users can view picks"
on public.picks for select
using (auth.role() = 'authenticated');

create policy "users can insert own picks on open markets"
on public.picks for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.markets m
    where m.id = market_id and m.status = 'open'
  )
);

create policy "users can update own picks on open markets"
on public.picks for update
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.markets m
    where m.id = market_id and m.status = 'open'
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.markets m
    where m.id = market_id and m.status = 'open'
  )
);
```

### 3) Auth settings

- Enable Email/Password provider in Supabase Auth.
- Add your GitHub Pages URL to allowed redirect URLs (if you later add OAuth/magic links).

## GitHub Pages deployment

This app is GitHub Pages compatible because it is static HTML/CSS/JS only.

1. Push to GitHub.
2. In repo settings → Pages, deploy from branch (e.g. `main`) root.
3. Ensure `config.js` is committed with your **public** values only:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

 Never put service role or secret keys in frontend code.

## File overview

- `index.html`: page layout
- `styles.css`: responsive styles
- `config.example.js`: frontend config template
- `app.js`: auth, markets, picks, leaderboard, admin actions

# NCAA 26 Dynasty Prediction Market (Joke Site)

A lightweight Vite + React app for a parody sportsbook/ESPN-style NCAA 26 dynasty prediction market.

## Features

- Home page showing active markets (open / locked / resolved)
- Leaderboard page based on correct picks
- Admin page for creating/resolving markets (UI scaffolding)
- Auth UI scaffold for Supabase sign-in
- Mobile-friendly layout
- Funny-but-readable sports media aesthetic

## Tech Choices

- **Vite + React (JavaScript)**
- **Minimal dependencies**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`
- Mock data designed to map cleanly to planned Supabase tables

## Project Structure

```text
.
├─ .github/workflows/deploy-pages.yml
├─ src/
│  ├─ components/
│  │  ├─ AuthPanel.jsx
│  │  ├─ Header.jsx
│  │  └─ MarketCard.jsx
│  ├─ data/
│  │  └─ mockData.js
│  ├─ pages/
│  │  ├─ AdminPage.jsx
│  │  ├─ HomePage.jsx
│  │  └─ LeaderboardPage.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ styles.css
├─ .env.example
├─ AGENTS.md
├─ index.html
├─ package.json
└─ vite.config.js
```

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template:

   ```bash
   cp .env.example .env
   ```

3. Fill in `.env` values:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - For local dev, `VITE_BASE_PATH=/`

4. Run dev server:

   ```bash
   npm run dev
   ```

## Supabase Notes

The app currently uses mock data and mock sign-in state in `src/data/mockData.js` and `src/App.jsx`.
Replace these with real Supabase calls when backend tables/auth are ready.

Assumed backend rules:

- users can sign in
- one pick per user per market
- markets move through `open`, `locked`, `resolved`
- leaderboard uses count of correct picks

## GitHub Pages Deployment

### 1) Configure repo settings

- In GitHub repository settings, set **Pages** source to **GitHub Actions**.

### 2) Add repository secrets

Add these Actions secrets:
main

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

codex/add-supabase-integration-to-vite-react-app
> Do not commit real secrets. Only the anon/publishable key belongs in the client.

## 3) Configure Supabase Auth

In your Supabase project dashboard:

1. Enable **Email** provider under Authentication.
2. Ensure **Magic Link** sign-in is enabled.
3. Add your local app URL (`http://localhost:5173`) as an allowed redirect URL.

## 4) Run the app

```bash
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Included flows

- Magic link sign-in by email.
- Session persistence across refreshes.
- Display-name setup/update after login.
- Sign out.
- UI placeholder text clarifying this is for a private friend-group site.

### 3) Push to `main`

The workflow at `.github/workflows/deploy-pages.yml` will:

- install dependencies
- build with
  - `VITE_BASE_PATH=/${{ github.event.repository.name }}/`
- deploy `dist/` to GitHub Pages

### 4) Base path behavior

`vite.config.js` uses:

- `process.env.VITE_BASE_PATH` when set (CI / project site)
- `/` fallback for local development

If you rename the repo, deployment keeps working because workflow derives the path from repository name.

## Future Integration Checklist

- Add `@supabase/supabase-js`
- Create `src/lib/supabaseClient.js`
- Implement auth flows (email OTP or OAuth)
- Persist picks and market states in Supabase tables
- Add RLS policies for one-pick-per-user integrity
main
main
main
main
