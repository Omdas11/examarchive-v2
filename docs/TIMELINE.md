# Project Timeline

## Phase 1 — Core Recovery ✅

**December 2024 – January 2025**

- Recovered core functionality from ExamArchive v1
- Set up Supabase backend (PostgreSQL + Auth + Storage)
- Implemented upload system with storage buckets
- Built authentication with Google OAuth
- Established basic role system (numeric levels)
- Created academic calendar and initial debug panel
- Configured RLS policies for all tables and buckets

See [PHASE1.md](PHASE1.md) for details.

## Phase 2 — Backend Migration & Stabilization ✅

**January – February 2025**

- Stabilized auth and RLS enforcement
- Enforced singleton Supabase client pattern
- Built backend-driven browse page (replaced static papers.json)
- Refined role system: 5 tiers (Visitor/Contributor/Reviewer/Publisher/Admin)
- Split admin workflow into approve (≥75) and publish (≥90)
- Added debug panel with error classification and log export
- Implemented visitor counter with RPC and sessionStorage dedup
- Created about page with live database stats
- Added support page for admin application requests
- Introduced brand.css tokens and theme cleanup
- Cleaned up console.log statements

See [PHASE2.md](PHASE2.md) for details.

## Phase 3 — Auth & User System 🔜

**Planned**

- User profile pages
- Email/password login option (in addition to Google OAuth)
- Session management improvements
- Account settings expansion
- Role request workflow refinement

## Phase 4 — Content Backend Expansion 🔜

**Planned**

- Full-text search across papers
- Syllabus mapping and linking
- Repeated/frequent question analysis
- Subject and department taxonomies
- Pagination and filtering for browse

## Phase 5 — AI Integration 🔜

**Planned**

- Smart search with semantic understanding
- Auto-tagging of uploaded papers (subject, year, exam type)
- Content recommendations based on browsing history
- Question pattern analysis

## Phase 6 — Public Launch 🔜

**Planned**

- Custom domain setup
- SEO optimization
- User onboarding flow
- Analytics dashboard
- Performance optimization
- Documentation for contributors
