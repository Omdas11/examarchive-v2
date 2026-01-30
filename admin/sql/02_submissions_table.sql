-- ============================================
-- SUBMISSIONS TABLE
-- Tracks upload → review → publish lifecycle
-- ============================================

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  
  -- File metadata
  original_filename text not null,
  file_size bigint,
  content_type text default 'application/pdf',
  
  -- Storage paths
  temp_path text,
  approved_path text,
  public_path text,
  public_url text,
  
  -- Paper metadata
  paper_code text,
  paper_name text,
  exam_year integer,
  university text,
  programme text,
  subject text,
  
  -- Status tracking
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'published')),
  
  -- Review info
  reviewer_id uuid references auth.users(id),
  review_notes text,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  published_at timestamp with time zone
);

-- Create indexes for common queries
create index if not exists submissions_user_id_idx on submissions(user_id);
create index if not exists submissions_status_idx on submissions(status);
create index if not exists submissions_reviewer_id_idx on submissions(reviewer_id);
create index if not exists submissions_created_at_idx on submissions(created_at desc);

-- Enable RLS
alter table submissions enable row level security;

-- Users can see their own submissions
create policy "users see own submissions"
on submissions for select
using (auth.uid() = user_id);

-- Users can insert their own submissions
create policy "users insert own submissions"
on submissions for insert
with check (auth.uid() = user_id);

-- Admins and reviewers can see all submissions
create policy "admins and reviewers see all submissions"
on submissions for select
using (
  exists (
    select 1 from profiles
    where id = auth.uid() 
    and role in ('admin', 'reviewer')
  )
);

-- Only admins can update submissions (approve/reject)
create policy "admins manage submissions"
on submissions for update
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can delete submissions
create policy "admins delete submissions"
on submissions for delete
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
