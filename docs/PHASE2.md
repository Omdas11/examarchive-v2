# Phase 2 — Backend Migration & Stabilization

**Period:** January – February 2025

## Summary

Phase 2 migrated the system from a partially static architecture to a fully backend-driven model. The browse page now queries Supabase directly, the approval workflow was split into distinct approve and publish steps, and the debug/auth systems were hardened.

## Achievements

### Auth & RLS Stabilization
- Enforced fresh `getUser()` calls before every database insert — auth state is never cached
- Tightened RLS policies to ensure storage and database security layers work independently
- Eliminated edge cases where stale sessions could bypass access controls

### Singleton Supabase Client Enforcement
- All pages now use `getSupabase()` from `js/supabase-client.js`
- Removed all direct `createClient()` calls across the codebase
- Ensured a single client instance is shared across all modules

### Debug Panel with Error Classification
- Upgraded debug panel to an ES module (`js/modules/debug.module.js`)
- Added auto-classification of errors: `[AUTH]`, `[RLS]`, `[STORAGE]`, `[CLIENT]`
- Added export, copy, and clear log functionality (Admin-only for full access)
- Role-gated visibility: hidden below level 90, full access at level 100

### Backend-Driven Browse Page
- Browse page now queries `submissions` table with `status = 'published'`
- Removed dependency on static `papers.json` for browse data
- Implemented signed URL generation for download links from `uploads-approved` bucket
- Paper cards rendered from live database query results

### Role-Based Approval System Refinement
- Expanded role tiers from 4 to 5 levels (added Publisher at 90)
- **Reviewer (≥75):** Can approve or reject pending submissions
- **Publisher (≥90):** Can publish approved submissions (makes them visible in Browse)
- **Admin (100):** Full access including counter resets and complete debug logging
- Split the admin workflow: approve and publish are now separate actions at different role thresholds

### Visitor Counter
- Implemented `increment_visit_counter()` RPC function in Supabase
- Added `sessionStorage`-based deduplication to prevent multiple counts per session
- Created `site_stats` table for persistent visitor count storage
- Counter displayed in the page footer

### About Page with Live Database Stats
- About page queries Supabase for real-time statistics (paper count, user count, etc.)
- Data is fetched live — no hardcoded numbers

### Support Page
- Created `support.html` for admin application requests
- Users can request elevated roles through a structured form

### Brand CSS Tokens & Theme Cleanup
- Introduced `css/brand.css` with centralized CSS custom property tokens
- Cleaned up theme variable naming for consistency
- All themes (light/dark/AMOLED) use the same token set with different values
- Added night mode support

### UI Refinements
- Added visitor badge display when users are logged out
- Removed the green dot auth indicator in favor of cleaner role-based UI
- Cleaned up `console.log` statements throughout the codebase (no debug noise in production)

### Phase 3 Preparation
- Added `// TODO: Phase 3` markers throughout the codebase for planned features
- Identified areas for auth system expansion, search, and user profiles

## Architecture Changes

| Before (Phase 1) | After (Phase 2) |
|---|---|
| Browse used static data | Browse queries Supabase directly |
| Single approve action | Approve (≥75) + Publish (≥90) split |
| 4 role tiers | 5 role tiers (added Publisher) |
| Debug panel basic | Debug panel with classification + export |
| No visitor tracking | Visitor counter with RPC + sessionStorage |
| Theme in common.css only | Brand tokens in brand.css |
| Console.log throughout | Console.log cleaned up |
