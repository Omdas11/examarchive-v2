# Timeline Log

## Phase 1 — Stabilization Complete

**Date:** February 2026

### Changes

- **Backend reset** — Replaced multi-SQL fragmented setup with clean single-SQL architecture
- **Single SQL architecture** — roles + submissions + buckets + RLS in 6 ordered scripts
- **Upload fixed** — Upload path changed to `{user_id}/{timestamp}-{filename}`, demo auto-approval streamlined, debug logging added
- **Calendar toggle added** — Month/Week view toggle (Google Calendar style), fixed date parsing with `parseLocalDate()` to prevent timezone shift
- **Debug redesigned** — Mobile-friendly slide-up panel (max 60vh), tabbed interface (Info/Warnings/Errors), human-readable messages with Reason/Check format
- **Documentation aligned** — All docs rewritten to reflect Phase 1 architecture
- **Repo health check** — Removed legacy references, aligned frontend with backend schema

### Architecture After Phase 1

```
Tables:       roles (user_id, level), submissions
Buckets:      uploads-temp (private), uploads-approved (public)
Role Levels:  0=visitor, 10=user, 50=reviewer, 80=moderator, 100=admin
RPC:          get_current_user_role_level()
Upload Path:  uploads-temp/{user_id}/{timestamp}-{filename}
```
