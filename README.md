# ExamArchive v2

> A modern, community-driven archive of university question papers.

## What It Is

ExamArchive is a static web application where students can upload, browse, and download university question papers. Built with vanilla HTML/CSS/JS and powered by Supabase for auth, database, and storage.

## Architecture

- **Frontend:** Static HTML/CSS/Vanilla JS — no framework, no build step
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Hosting:** GitHub Pages
- **Single SQL setup** — 6 ordered scripts in `admin/sql/`

## Role Levels

| Level | Role | Access |
|---|---|---|
| 0 | Visitor | Browse approved papers |
| 10 | User | Upload papers |
| 50 | Reviewer | Approve/reject submissions |
| 80 | Moderator | User management |
| 100 | Admin | Full access |

## Upload Flow

1. Authenticated user uploads a PDF → saved to `uploads-temp` bucket
2. Submission row created with `status = "pending"`
3. Reviewer approves → file copied to `uploads-approved`, status updated
4. Paper appears in Browse page

**Demo papers** skip review and appear immediately.

## Auth & RLS Flow

Authentication is strictly enforced at the upload boundary to prevent NULL `user_id` violations:

### Upload Guard

1. **Auth Ready Check** — Upload button is blocked until `auth:ready` event fires
2. **User Verification** — Before any insert, `supabase.auth.getUser()` is called
3. **Hard Block** — If no user or auth error, upload is rejected immediately
4. **User ID Lock** — Only the fresh `user.id` from `getUser()` is used for insert

### RLS Policy

The `submissions` table has a row-level security policy:

```sql
CREATE POLICY "Users can insert own submissions"
ON submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

This prevents:
- NULL `user_id` inserts
- Users inserting submissions for other users
- Unauthenticated insertions

### Error Handling

If RLS blocks an insert, the user sees:
> "Upload blocked by permission policy. Please re-login."

Not generic "permission denied" — the exact cause is surfaced.

### Debug Panel Auth Status

Open the debug panel (🐛 icon at bottom) to view:
- Session Status: Logged In / Not Logged In
- User ID: `xxxxx`
- Role Level: `10` (User), `50` (Reviewer), etc.

This is logged:
- On page load
- When debug panel opens
- At upload start

## How to Run

1. Clone this repository
2. Set up a Supabase project — run SQL scripts from `admin/sql/` in order
3. Update `js/supabase.js` with your project URL and anon key
4. Serve with any static file server:
   ```bash
   python -m http.server 8000
   ```
5. Open `http://localhost:8000`

## Documentation

All docs are in [`/docs`](docs/):

| Document | Content |
|---|---|
| [Architecture](docs/ARCHITECTURE_MASTER_PLAN.md) | Full system overview |
| [Backend Setup](docs/BACKEND_SETUP.md) | SQL scripts and bucket config |
| [Frontend Flow](docs/FRONTEND_FLOW.md) | Upload lifecycle and approval logic |
| [Roles System](docs/ROLES_SYSTEM.md) | Role levels and RPC function |
| [Storage Setup](docs/STORAGE_SETUP.md) | Bucket policies and file paths |
| [Review Flow](docs/REVIEW_FLOW.md) | Submission approval pipeline |
| [Calendar System](docs/CALENDAR_SYSTEM.md) | Holiday calendar data and views |
| [Debug System](docs/DEBUG_SYSTEM.md) | Debug panel usage and logging |
| [Timeline Log](docs/TIMELINE_LOG.md) | Development history |

## Roadmap

- **Phase 1** ✅ — Core Recovery (backend reset, upload fix, calendar, debug)
- **Phase 2** — Search & Browse enhancements
- **Phase 3** — Syllabus and repeated questions
- **Phase 4** — AI integration

## License

MIT License — See LICENSE file for details.
