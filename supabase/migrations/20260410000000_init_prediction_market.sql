-- NCAA26 Prediction Market schema
-- This migration creates core domain tables, indexes, and auth-profile sync automation.

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'User profile rows linked 1:1 with auth.users.';
comment on column public.profiles.id is
  'Matches auth.users.id for the authenticated user.';
comment on column public.profiles.display_name is
  'Public-facing display name shown in the app.';
comment on column public.profiles.is_admin is
  'Flag for application administrators.';
comment on column public.profiles.created_at is
  'Timestamp when the profile row was created.';

-- -----------------------------------------------------------------------------
-- markets
-- -----------------------------------------------------------------------------
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'open',
  lock_time timestamptz not null,
  resolved_option_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.markets is
  'Prediction markets created by admins/users.';
comment on column public.markets.id is
  'Unique market identifier.';
comment on column public.markets.title is
  'Short market question/title.';
comment on column public.markets.description is
  'Long-form details or market rules.';
comment on column public.markets.status is
  'Lifecycle status (for example: open, locked, resolved, canceled).';
comment on column public.markets.lock_time is
  'Time after which new picks are no longer accepted.';
comment on column public.markets.resolved_option_id is
  'Winning option once a market is resolved.';
comment on column public.markets.created_by is
  'Profile ID of the market creator.';
comment on column public.markets.created_at is
  'Timestamp when the market was created.';

-- -----------------------------------------------------------------------------
-- market_options
-- -----------------------------------------------------------------------------
create table public.market_options (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  unique (id, market_id)
);

comment on table public.market_options is
  'Selectable outcomes/options for each market.';
comment on column public.market_options.id is
  'Unique market option identifier.';
comment on column public.market_options.market_id is
  'Parent market for this option.';
comment on column public.market_options.label is
  'Option text shown to users.';
comment on column public.market_options.created_at is
  'Timestamp when the option was created.';

-- Ensure resolved_option_id points to an existing option.
alter table public.markets
  add constraint markets_resolved_option_id_fkey
  foreign key (resolved_option_id)
  references public.market_options(id)
  on delete set null;

-- -----------------------------------------------------------------------------
-- picks
-- -----------------------------------------------------------------------------
create table public.picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  option_id uuid not null references public.market_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, market_id)
);

comment on table public.picks is
  'A user\'s selected option for a market (one pick per market).';
comment on column public.picks.id is
  'Unique pick identifier.';
comment on column public.picks.user_id is
  'Profile ID of the user making the pick.';
comment on column public.picks.market_id is
  'Market this pick belongs to.';
comment on column public.picks.option_id is
  'Chosen option for the market.';
comment on column public.picks.created_at is
  'Timestamp when the pick was submitted.';

-- -----------------------------------------------------------------------------
-- Helpful indexes
-- -----------------------------------------------------------------------------
create index markets_status_idx on public.markets (status);
create index markets_lock_time_idx on public.markets (lock_time);
create index markets_created_by_idx on public.markets (created_by);

create index market_options_market_id_idx on public.market_options (market_id);

create index picks_user_id_idx on public.picks (user_id);
create index picks_market_id_idx on public.picks (market_id);
create index picks_option_id_idx on public.picks (option_id);
create index picks_market_option_idx on public.picks (market_id, option_id);

-- -----------------------------------------------------------------------------
-- Auto-create profile for new auth users
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1),
      'User'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user_profile() is
  'Creates a profile row when a new auth.users record is inserted.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();
