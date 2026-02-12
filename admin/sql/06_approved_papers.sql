-- ============================================
-- APPROVED PAPERS TABLE
-- Stores metadata for papers that have been reviewed and approved
-- ============================================

create table if not exists approved_papers (
  id uuid primary key default gen_random_uuid(),
  paper_code text,
  exam_year int,
  file_path text,
  uploaded_by uuid,
  is_demo boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists approved_papers_paper_code_idx on approved_papers(paper_code);
create index if not exists approved_papers_exam_year_idx on approved_papers(exam_year);

-- Enable RLS
alter table approved_papers enable row level security;

-- Anyone can read approved papers (public browse)
create policy "public read approved papers"
on approved_papers for select
using (true);

-- Only reviewer+ (level >= 50) can insert
create policy "reviewers insert approved papers"
on approved_papers for insert
with check (get_current_user_role_level() >= 50);

-- Only admin (level >= 100) can delete
create policy "admins delete approved papers"
on approved_papers for delete
using (get_current_user_role_level() >= 100);
