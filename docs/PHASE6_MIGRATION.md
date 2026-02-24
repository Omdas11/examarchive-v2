# Phase 6 – Production Hybrid Storage Migration (Supabase + Appwrite)

## Summary

File storage has been migrated from **Supabase Storage** to **Appwrite Storage**.  
Supabase continues to own **Auth, DB, RLS, Roles, and RPC** — nothing auth- or DB-related changed.

---

## Modified Files

| File | Change |
|------|--------|
| `js/appwrite-client.js` | **New** — Appwrite client singleton (Project ID + Endpoint only, no secret keys) |
| `admin/sql/22_phase6_appwrite_migration.sql` | **New** — Adds `appwrite_file_id` and `file_url` columns to `submissions` |
| `js/upload-handler.js` | Replaced Supabase Storage upload with Appwrite `createFile`; added DB rollback |
| `js/storage-helpers.js` | Replaced all Supabase bucket helpers with Appwrite equivalents |
| `js/browse.js` | Uses `file_url` from DB instead of generating Supabase signed URLs |
| `js/paper.js` | Uses `file_url` from DB; removed Supabase storage listing for notes |
| `admin/review.js` | Approve = DB status only; Reject = delete Appwrite file + update DB |
| `admin/dashboard/dashboard.js` | Same pattern as review.js |
| `admin/dashboard.js` | Same pattern as review.js |
| `profile.html` | Avatar upload migrated to Appwrite `avatars` bucket |
| `upload.html` | Added Appwrite SDK CDN + `appwrite-client.js` |
| `admin/review.html` | Added Appwrite SDK CDN + `appwrite-client.js` |
| `admin/dashboard/index.html` | Added Appwrite SDK CDN + `appwrite-client.js` |
| `admin/dashboard.html` | Added Appwrite SDK CDN + `appwrite-client.js` |
| `profile.html` | Added Appwrite SDK CDN + `appwrite-client.js` |

---

## Architecture Overview

### Upload Flow (Phase 6)
1. User selects PDF + fills form (Supabase auth still required)
2. File uploaded to Appwrite `papers` bucket via `Storage.createFile()`
3. `appwrite_file_id` and `file_url` returned from Appwrite
4. Supabase `submissions` row inserted with `appwrite_file_id` + `file_url`
5. **Rollback**: if DB insert fails → Appwrite file is deleted

### Approval Flow (Phase 6)
- No file movement between buckets needed
- Admin/reviewer simply updates `submissions.status` in Supabase DB
- `approved_path` is set to `file_url` for backwards compatibility

### Reject/Delete Flow (Phase 6)
- Appwrite file deleted using `appwrite_file_id` stored in DB
- DB record updated to `rejected`/deleted

### View/Download Flow (Phase 6)
- `file_url` stored in DB is used directly (public Appwrite bucket, no signed URL needed)
- Legacy records (pre-migration, `file_url IS NULL`) fall back to Supabase signed URL

---

## Appwrite Setup Requirements

Run the SQL migration before deploying:
```sql
-- admin/sql/22_phase6_appwrite_migration.sql
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS appwrite_file_id text,
  ADD COLUMN IF NOT EXISTS file_url text;
```

### Appwrite Bucket Configuration

Create two buckets in your Appwrite project:

| Bucket ID | Name | Permissions |
|-----------|------|-------------|
| `papers` | Paper PDFs | Read: `any`, Create: `any`; Delete: restrict to your server-side function or API key (see Security Notes) |
| `avatars` | User Avatars | Read: `any`, Create: `any`, Delete: `any` |

**File Size Limits**: Set to 50MB for `papers`, 2MB for `avatars`.

### Update `js/appwrite-client.js`

Replace the placeholder values with your actual Appwrite credentials:
```js
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";  // or self-hosted URL
const APPWRITE_PROJECT_ID = "your-project-id";              // from Appwrite console
const APPWRITE_PAPERS_BUCKET_ID = "papers";                 // bucket ID you created
const APPWRITE_AVATARS_BUCKET_ID = "avatars";               // bucket ID you created
```

These are **public, non-secret values** — safe to include in frontend code.  
**Never add Appwrite API keys or secret keys to any frontend file.**

---

## Security Notes

- No Appwrite secret keys are used in the frontend
- Only `Project ID` and `Endpoint` are exposed (equivalent to Supabase's anon key pattern)
- Supabase Auth validates users before any upload code runs
- Appwrite bucket permissions allow unauthenticated file creation (users are Supabase-authed, not Appwrite-authed)
- **Production recommendation**: Restrict `papers` bucket Delete permission to an Appwrite Function or server-side API key rather than `any`. The client-side rollback (`deleteFile` on DB failure) is a best-effort; orphaned files are low risk since they are only accessible by knowing the file ID.
- File URLs are stable and permanent (no expiry, unlike Supabase signed URLs)

---

## Reversible Fallback Plan

To revert to Supabase Storage:

1. **Revert these JS files** from git:
   - `js/upload-handler.js`
   - `js/storage-helpers.js`
   - `js/browse.js`
   - `js/paper.js`
   - `admin/review.js`
   - `admin/dashboard/dashboard.js`
   - `admin/dashboard.js`
   - `profile.html`

2. **Remove Appwrite script tags** from HTML files (the 2 lines per file).

3. **No DB rollback needed** — the `appwrite_file_id` and `file_url` columns are additive (nullable). Old code ignores them. New SQL columns can be left in place or removed:
   ```sql
   -- Optional cleanup only if reverting:
   ALTER TABLE submissions DROP COLUMN IF EXISTS appwrite_file_id;
   ALTER TABLE submissions DROP COLUMN IF EXISTS file_url;
   ```

4. Ensure `uploads-temp` and `uploads-approved` Supabase Storage buckets still exist and have RLS policies intact.

---

## Confirmed Unchanged

- ✅ Supabase Auth — untouched
- ✅ RLS policies — untouched  
- ✅ Role & approval logic — untouched
- ✅ Existing UI — untouched
- ✅ Upload status flow (pending → approved → published) — untouched
- ✅ Mobile-first layout — untouched
