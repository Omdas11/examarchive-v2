# Phase 1 — Core Recovery

**Period:** December 2024 – January 2025

## Summary

Phase 1 focused on recovering core functionality from ExamArchive v1 and establishing the new Supabase-backed architecture. The goal was to have a working upload-and-browse system with authentication and basic role management.

## Achievements

### Core Recovery from v1
- Migrated from the legacy v1 codebase to a clean static HTML/CSS/JS frontend
- Re-established the browse and upload pages with updated UI
- Preserved the original project goals while modernizing the stack

### Backend Reset with Supabase
- Set up Supabase project with PostgreSQL database
- Created `roles` and `submissions` tables with RLS enabled
- Wrote SQL setup scripts (`admin/sql/01` through `07`) for reproducible deployment

### Upload System
- Implemented PDF upload flow with file validation
- Created `uploads-temp` (private) and `uploads-approved` (public) storage buckets
- Built `upload-handler.js` for storage operations and submission inserts
- Added required field validation (`user_id`, `paper_code`, `year`, `storage_path`, etc.)

### Authentication
- Integrated Google OAuth via Supabase Auth
- Built `auth-controller.js` for centralized auth state management
- Implemented `auth:ready` event pattern for gating UI features on session restore

### Basic Role System
- Established numeric role levels (`roles` table)
- Auto-assignment of level 10 (Contributor) on signup via database trigger
- Created RPC functions: `get_current_user_role_level()`, `is_admin()`

### Calendar & Debug Panel Basics
- Added academic calendar feature
- Built initial debug panel for development diagnostics

### Storage Bucket Setup
- Configured RLS policies for `uploads-temp` and `uploads-approved`
- Separated storage RLS from database RLS as independent security layers

## Foundation Laid

Phase 1 established the architectural patterns that Phase 2 would refine:
- Singleton Supabase client pattern (formalized in Phase 2)
- Fresh `getUser()` before inserts (enforced in Phase 2)
- Role-level-based access control (expanded in Phase 2)
- Debug panel (enhanced in Phase 2)
