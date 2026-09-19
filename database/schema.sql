-- KIVO Supabase / PostgreSQL schema.
-- Run in the Supabase SQL editor. The backend works without it
-- (seeded in-memory store) and activates Supabase automatically when
-- SUPABASE_URL + SUPABASE_SERVICE_KEY are set.

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('parent','child','coach')),
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists children (
  id text primary key,
  parent_id text not null references users(id) on delete cascade,
  name text not null,
  age int not null check (age between 5 and 16),
  height int not null default 120,
  fitness_level text not null default 'Beginner',
  favorite_activities text[] not null default '{}',
  avatar_color text not null default '#2563EB',
  created_at timestamptz not null default now()
);
create index if not exists children_parent_idx on children(parent_id);

create table if not exists challenges (
  id text primary key,
  name text not null,
  category text not null check (category in ('STRONGER','FITTER','FASTER','CHAMPS')),
  difficulty text not null default 'L1',
  duration text not null default '60s',
  description text not null default ''
);

create table if not exists performance (
  id text primary key,
  child_id text not null references children(id) on delete cascade,
  challenge_id text not null references challenges(id),
  score int not null check (score between 0 and 100),
  raw jsonb not null default '{}',
  improvement numeric not null default 0,
  is_personal_best boolean not null default false,
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists performance_child_idx on performance(child_id, created_at);

create table if not exists progress (
  child_id text primary key references children(id) on delete cascade,
  stronger_score int not null default 40,
  fitter_score int not null default 40,
  faster_score int not null default 40,
  champs_score int not null default 40,
  updated_at timestamptz not null default now()
);

create table if not exists badges (
  id text primary key,
  child_id text not null references children(id) on delete cascade,
  badge_name text not null,
  earned_at timestamptz not null default now(),
  unique (child_id, badge_name)
);

create table if not exists streaks (
  child_id text primary key references children(id) on delete cascade,
  current_days int not null default 0,
  longest_days int not null default 0,
  last_active_date date not null default current_date
);

create table if not exists xp (
  child_id text primary key references children(id) on delete cascade,
  total int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists ai_recommendations (
  id text primary key,
  child_id text not null references children(id) on delete cascade,
  payload jsonb not null,
  source text not null default 'deterministic',
  created_at timestamptz not null default now()
);

-- Static catalogue (mirrors backend/src/services/store/challenges.ts)
insert into challenges (id, name, category, difficulty, duration, description) values
  ('rope-rush','Rope Rush','FITTER','L1–L5','60s','Complete as many jumps as possible in 60 seconds.'),
  ('reaction-rush','Reaction Rush','FASTER','Adaptive','~45s','Tap the glowing pod as fast as you can.'),
  ('agility-command','Agility Command','CHAMPS','Progressive','~60s','Follow the station sequence in order.')
on conflict (id) do nothing;
