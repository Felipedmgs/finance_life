 senha data base supabase
 vn65OQ0EaYuiuZRj


create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paid_until date null,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, -- sempre dia 01 do mês
  income numeric(12,2) not null default 0,
  fixed numeric(12,2) not null default 0,
  variable numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists budgets_user_month_uniq
  on public.budgets(user_id, month);
