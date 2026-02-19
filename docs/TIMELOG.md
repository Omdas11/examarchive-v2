# Timelog

## Full Stabilization & Cleanup Pass

**Date:** February 2026

### Changes

- **Upload Insert Fix:** Added `content_type` field to submission inserts; ensured all NOT NULL fields are populated
- **Theme System Fix:** Replaced all hardcoded hex colors with CSS variables (`--color-success`, `--color-error`, `--color-info`, `--color-warning`, `--color-muted`, `--color-purple`); added dark/AMOLED variants for status and avatar colors
- **Mobile Header Fix:** Added `min-height` to header; fixed avatar ring positioning using `inset` instead of `transform`; improved mobile breakpoint spacing
- **Login Hint Marker:** Added pulsing "Tap to Login" indicator near avatar for unauthenticated users; shown once per session
- **Debug Panel Restriction:** Set `DEBUG_FORCE_ENABLE = false`; restricted to role level > 80 via RPC; no DOM injection for unauthorized users; added smooth collapse/expand animation; improved mobile readability
- **Profile Role Display Fix:** Verified `mapRole()` descending order; fresh RPC fetch; no stale localStorage cache
- **Repo Cleanup:** Removed deprecated functions (`normalizeRole`, `clearRoleCache`, `getUserProfile`, `initializeGlobalRoleState`, `waitForRole`); removed phase comments; removed all stale `exam_year` and `temp_path` references; fixed hardcoded colors in admin CSS, avatar CSS, settings CSS, notices-calendar.js, auth-controller.js
- **Documentation Rewrite:** Updated README, FRONTEND_FLOW.md, DEBUG_SYSTEM.md, ROLE_SYSTEM.md, STORAGE_FLOW.md, BACKEND.md, TIMELOG.md

---

## Role Fix + Submission Insert Fix

**Date:** February 2026

### Changes

- Confirmed `mapRole(level)` in `js/utils/role-utils.js` uses correct descending order (`>= 100` Admin, `>= 80` Reviewer, `>= 10` Contributor, default Visitor) — no early return issues
- Fixed submission insert payload in `js/upload-handler.js` to include `original_filename: file.name` and `file_size: file.size` (both NOT NULL in DB)
- Renamed `exam_year` → `year` and `temp_path` → `storage_path` in all JS files to match new schema
- Updated `admin/dashboard.js`, `admin/review.js`, `admin/dashboard/dashboard.js`, `js/upload.js` to use new column names
- Improved debug error log message to `Submission insert failed:` for both pending and demo inserts
- Created SQL migration `08_submission_fields_migration.sql` to apply schema changes
- Created `docs/FRONTEND_FLOW.md` documenting upload payload and NOT NULL field requirements
- Updated `docs/DEBUG_SYSTEM.md` with NOT NULL constraint debugging guidance
- Updated `README.md` with required submission fields table

---

## Storage + Profile Alignment

**Date:** February 2026

### Changes

- Implemented centralized `mapRole(level)` function in `js/utils/role-utils.js`
- Updated role mapping to use level-based logic (not name from DB)
- Profile panel now fetches role level and maps using centralized function
- Default to level 10 (Contributor) if no role row exists
- Updated icon mapping: 👑 Admin, 🛡️ Reviewer, ✍️ Contributor, 👤 Visitor
- Improved storage error logging to include bucket name, path, and full error object
- Updated documentation to reflect storage buckets, RLS policies, and role mapping

---

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
