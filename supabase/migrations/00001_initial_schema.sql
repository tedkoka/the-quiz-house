-- The Quiz House Schema
-- Run this against your Supabase SQL editor

-- ============================================================
-- 1. Profiles
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null,
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone can read profiles (needed for leaderboard display_name)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

-- Users can update only their own profile
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Insert is handled by the trigger below
create policy "Service role can insert profiles"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'player'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. Quizzes
-- ============================================================
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'General',
  price_cents integer not null default 0,
  time_per_question_seconds integer not null default 30,
  published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;

-- Public can read published quizzes
create policy "Published quizzes are viewable by everyone"
  on public.quizzes for select using (published = true);

-- Admins can read all quizzes
create policy "Admins can read all quizzes"
  on public.quizzes for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can insert/update/delete quizzes
create policy "Admins can insert quizzes"
  on public.quizzes for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update quizzes"
  on public.quizzes for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete quizzes"
  on public.quizzes for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 3. Questions
-- ============================================================
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  options jsonb not null, -- string array
  correct_option_index integer not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

-- Public can read questions for published quizzes (correct_option_index is filtered at API level)
create policy "Questions of published quizzes are viewable"
  on public.questions for select using (
    exists (select 1 from public.quizzes where id = quiz_id and published = true)
  );

-- Admins can read all questions
create policy "Admins can read all questions"
  on public.questions for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can CUD questions
create policy "Admins can insert questions"
  on public.questions for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update questions"
  on public.questions for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete questions"
  on public.questions for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 4. Orders
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  quiz_id uuid not null references public.quizzes(id),
  amount_cents integer not null,
  quantity integer not null default 1,
  order_type text not null default 'b2c' check (order_type in ('b2c', 'corporate')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  payfast_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Users can read their own orders
create policy "Users can read own orders"
  on public.orders for select using (auth.uid() = user_id);

-- Users can insert their own orders
create policy "Users can create orders"
  on public.orders for insert with check (auth.uid() = user_id);

-- Admins can read all orders
create policy "Admins can read all orders"
  on public.orders for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 5. Entitlements
-- ============================================================
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  quiz_id uuid not null references public.quizzes(id),
  order_id uuid not null references public.orders(id),
  attempts_allowed integer not null default 1,
  attempts_used integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- Users can read their own entitlements
create policy "Users can read own entitlements"
  on public.entitlements for select using (auth.uid() = user_id);

-- Admins can read all entitlements
create policy "Admins can read all entitlements"
  on public.entitlements for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 6. Redeem Codes
-- ============================================================
create table public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  quiz_id uuid not null references public.quizzes(id),
  code text not null unique,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.redeem_codes enable row level security;

-- Code owner (order creator) can see their codes
create policy "Order owners can read their codes"
  on public.redeem_codes for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

-- Admins can read all codes
create policy "Admins can read all codes"
  on public.redeem_codes for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 7. Attempts
-- ============================================================
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  quiz_id uuid not null references public.quizzes(id),
  entitlement_id uuid not null references public.entitlements(id),
  score integer not null default 0,
  total_time_seconds numeric not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.attempts enable row level security;

-- Users can read their own attempts
create policy "Users can read own attempts"
  on public.attempts for select using (auth.uid() = user_id);

-- Admins can read all attempts
create policy "Admins can read all attempts"
  on public.attempts for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 8. Attempt Answers
-- ============================================================
create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option_index integer not null,
  is_correct boolean not null default false,
  time_taken_seconds numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.attempt_answers enable row level security;

-- Users can read their own attempt answers
create policy "Users can read own attempt answers"
  on public.attempt_answers for select using (
    exists (select 1 from public.attempts where id = attempt_id and user_id = auth.uid())
  );

-- Admins can read all attempt answers
create policy "Admins can read all attempt answers"
  on public.attempt_answers for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 9. Quiz Drafts (AI)
-- ============================================================
create table public.quiz_drafts (
  id uuid primary key default gen_random_uuid(),
  quiz_json jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  qa_report jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.quiz_drafts enable row level security;

-- Only admins can access drafts
create policy "Admins can read drafts"
  on public.quiz_drafts for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert drafts"
  on public.quiz_drafts for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update drafts"
  on public.quiz_drafts for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete drafts"
  on public.quiz_drafts for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 10. Leaderboard view (materialized for perf, or use function)
-- ============================================================
create or replace function public.get_leaderboard(p_quiz_id uuid, p_limit integer default 50)
returns table (
  display_name text,
  rank bigint,
  score integer,
  total_time_seconds numeric
) as $$
  select
    p.display_name,
    row_number() over (order by best.score desc, best.total_time_seconds asc) as rank,
    best.score,
    best.total_time_seconds
  from (
    select distinct on (a.user_id)
      a.user_id,
      a.score,
      a.total_time_seconds
    from public.attempts a
    where a.quiz_id = p_quiz_id and a.completed = true
    order by a.user_id, a.score desc, a.total_time_seconds asc
  ) best
  join public.profiles p on p.id = best.user_id
  order by best.score desc, best.total_time_seconds asc
  limit p_limit;
$$ language sql stable;

-- Function to get a user's rank
create or replace function public.get_user_rank(p_quiz_id uuid, p_user_id uuid)
returns table (
  display_name text,
  rank bigint,
  score integer,
  total_time_seconds numeric
) as $$
  select * from (
    select
      p.display_name,
      row_number() over (order by best.score desc, best.total_time_seconds asc) as rank,
      best.score,
      best.total_time_seconds
    from (
      select distinct on (a.user_id)
        a.user_id,
        a.score,
        a.total_time_seconds
      from public.attempts a
      where a.quiz_id = p_quiz_id and a.completed = true
      order by a.user_id, a.score desc, a.total_time_seconds asc
    ) best
    join public.profiles p on p.id = best.user_id
  ) ranked
  where ranked.display_name = (select display_name from public.profiles where id = p_user_id);
$$ language sql stable;
