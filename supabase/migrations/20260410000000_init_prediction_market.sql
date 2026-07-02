-- Waiting on the World to Change schema draft
-- Supabase-backed version of the display-name-only NCAA dynasty prediction market.

create extension if not exists pgcrypto;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  dynasty_team text not null,
  dynasty_team_logo_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'locked', 'resolved')),
  lock_label text not null default 'Kickoff',
  point_value integer not null default 1 check (point_value > 0),
  resolved_option_id uuid,
  created_by uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_options (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, market_id)
);

alter table public.markets
  add constraint markets_resolved_option_id_fkey
  foreign key (resolved_option_id)
  references public.market_options(id)
  on delete set null;

create table public.picks (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  option_id uuid not null references public.market_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, market_id)
);

create index markets_status_idx on public.markets (status);
create index markets_season_id_idx on public.markets (season_id);
create index picks_player_id_idx on public.picks (player_id);
create index picks_market_id_idx on public.picks (market_id);
create index market_options_market_id_idx on public.market_options (market_id);
