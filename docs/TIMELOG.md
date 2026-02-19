# Timelog

## Frontend Alignment + Doc Rebuild

**Date:** February 2026

### Changes

- Fixed frontend upload `user_id` alignment with RLS policy
- Aligned role system to 4-tier: 0 (Visitor), 10 (Contributor), 80 (Reviewer), 100 (Admin)
- Added admin/reviewer bypass (level ≥ 80) to submissions insert policy
- Updated reviewer threshold from level 50 to level 80
- Refactored role fallback logic (default to `contributor` instead of `user`)
- Added `[UPLOAD]` debug tags to upload handler
- Added `RLS` as explicit debug module category
- Rebuilt all documentation to match current architecture
- Rewrote README with updated role system, upload flow, and security model

---

## Phase 2 — Auth + RLS Stabilization (Full Singleton Enforcement)

**Date:** February 2026

### Changes

- Enforced universal singleton pattern: all files use `getSupabase()` from `js/supabase-client.js`
- Eliminated direct `window.__supabase__` access (kept only for backward compatibility)
- Added debug panel error classification: `[AUTH]`, `[RLS]`, `[STORAGE]`, `[CLIENT]`
- Color-coded error borders: Auth=Blue, RLS=Red, Storage=Orange, Client=Purple
- Added explicit RLS error detection in upload handler insert paths
- Verified script loading order across all HTML files

---

## Phase 1.3 — Auth & RLS Stabilization

**Date:** February 2026

### Changes

- Replaced session-based auth with fresh `getUser()` call before every insert
- Added `authReady` flag to block uploads before auth initialization
- Added `printAuthStatus()` to debug panel (session, user ID, role level)
- Detect RLS errors and show "Upload blocked by permission policy. Please re-login."
- Added auth indicator badge to header (🟢/🔴)
- Increased debug deduplication window to 800ms

---

## Phase 1 — Core Stabilization

**Date:** February 2026

### Changes

- Backend reset with clean single-SQL architecture
- Upload path changed to `{user_id}/{timestamp}-{filename}`
- Demo paper auto-approval streamlined
- Calendar month/week toggle added
- Debug panel redesigned: mobile-friendly slide-up, tabbed interface
- All documentation aligned with Phase 1 architecture
