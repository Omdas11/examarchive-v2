-- ============================================
-- SUBMISSIONS TABLE
-- Tracks user uploads pending review
-- ============================================

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  paper_code text,
  exam_year int,
  temp_path text,
  approved_path text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists submissions_user_id_idx on submissions(user_id);
create index if not exists submissions_status_idx on submissions(status);
create index if not exists submissions_created_at_idx on submissions(created_at desc);

-- Enable RLS
alter table submissions enable row level security;

-- Users can see their own submissions
create policy "users see own submissions"
on submissions for select
using (auth.uid() = user_id);

-- Users can insert their own submissions
-- Admin/Reviewer bypass: role level >= 80 can insert on behalf of others
create policy "users insert own submissions"
on submissions for insert
with check (
  auth.uid() = user_id
  or get_current_user_role_level() >= 80
);

-- Reviewers and admins (level >= 80) can see all submissions
create policy "reviewers see all submissions"
on submissions for select
using (get_current_user_role_level() >= 80);

-- Reviewers and admins can update submissions (only status and approved_path fields)
create policy "reviewers update submissions"
on submissions for update
using (get_current_user_role_level() >= 80)
with check (get_current_user_role_level() >= 80);
