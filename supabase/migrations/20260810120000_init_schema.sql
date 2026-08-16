-- Initial schema for Smart Asset Optimizer.
-- Tables the app actually uses (user_profiles auto-populated on sign-up,
-- user_preferences, watchlist), each protected by RLS keyed on auth.uid().

-- User profiles: one row per auth user, auto-populated from sign-up metadata.
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  country text,
  reason_for_use text,
  referral_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;

create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Populate a profile row automatically when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, email, full_name, country, reason_for_use, referral_source)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'country',
    new.raw_user_meta_data ->> 'reason_for_use',
    new.raw_user_meta_data ->> 'referral_source'
  );
  return new;
end;
$$;

-- The trigger runs as the function owner; no external role should call it directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User notification preferences (one row per user; upserted on user_id).
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  market_alerts boolean not null default false,
  portfolio_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;

create policy "Users manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_preferences_user_id_idx on public.user_preferences(user_id);

-- Per-user stock watchlist.
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  name text,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);
alter table public.watchlist enable row level security;

create policy "Users manage their own watchlist"
  on public.watchlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists watchlist_user_id_idx on public.watchlist(user_id);
