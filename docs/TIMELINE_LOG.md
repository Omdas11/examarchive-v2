# Timeline Log

> Engineering memory. What changed, when, and why.

---

## 2026-02-10 — Phase 1: Hard Reset

### What Changed

- **Documentation reset**: All previous docs archived to `docs/_archive/`. New minimal doc set created.
- **Phase system restart**: Phases reset to start from Phase 1 (Core Recovery).
- **Upload fix**: Fixed upload pipeline to work correctly with Supabase Storage.
- **Avatar fix**: Header avatar now shows Google/GitHub provider profile image with graceful fallback.
- **Browse page honesty**: Browse page now clearly distinguishes between static legacy papers and the absence of approved uploads. Shows honest empty state when no approved papers exist.
- **Repo audit**: `docs/REPO_AUDIT.md` created with full analysis of every file in the repo.

### Why

The project had accumulated technical debt: upload was broken, avatar didn't show provider images, browse page showed cards from static JSON that appeared to be approved uploads, and documentation was outdated and fragmented. A hard reset was needed to establish a clean foundation for the next 100 days.

### Files Changed

- `docs/` — Full documentation reset (6 old docs archived, 8 new docs created)
- `js/avatar-utils.js` — Fixed to update header avatar with provider image
- `js/browse.js` — Added honest empty state messaging
- `js/upload-handler.js` — Upload pipeline fixes
- `partials/header.html` — Avatar element updated for provider image support

---

*Previous history (Phase 9.2 era) is preserved in `docs/_archive/` for reference.*
