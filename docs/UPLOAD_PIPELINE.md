# Upload Pipeline

> Complete upload flow from file selection to admin approval.

---

## Overview

1. User selects PDF file on `upload.html`
2. Auth is verified via `auth-controller.js`
3. File is uploaded to Supabase Storage (`uploads-temp` bucket)
4. Metadata is inserted into `submissions` table (status: `pending`)
5. Admin reviews submission in `admin/dashboard.html`
6. Approved files are moved to `uploads-approved` then `uploads-public`
7. Published papers become visible on browse page

---

## Step-by-Step

### 1. File Selection

- User clicks file input or drags PDF onto drop zone
- `upload.js` validates: must be PDF, captured in `selectedFile`
- File size limit: 50MB

### 2. Auth Verification

- `upload.js` waits for `auth:ready` event from `auth-controller.js`
- If no session: shows "Sign in required" UI
- If authenticated: shows upload form

### 3. Form Submission

- User enters paper code and exam year
- Clicks "Upload Paper"
- `upload.js` calls `UploadHandler.handlePaperUpload(file, metadata, onProgress)`

### 4. Storage Upload (`upload-handler.js`)

```
handlePaperUpload(file, metadata, onProgress)
  → Validate file type (PDF only)
  → Validate file size (< 50MB)
  → Wait for Supabase client (window.waitForSupabase())
  → Verify authenticated session (supabase.auth.getSession())
  → Generate storage path: {userId}/{timestamp}-{filename}
  → Upload to 'uploads-temp' bucket
  → Create submission record in DB
  → Return { success, submissionId, message }
```

### 5. Metadata Insert

Submission record fields:
- `user_id` — authenticated user ID
- `original_filename` — original file name
- `file_size` — file size in bytes
- `content_type` — MIME type (application/pdf)
- `temp_path` — path in uploads-temp bucket
- `paper_code` — paper/subject code
- `paper_name` — paper name (optional)
- `exam_year` — examination year
- `status` — `pending` (default)

### 6. Admin Review

- Admin sees pending submissions in dashboard
- Can approve, reject, or request changes
- Approved files are moved through bucket stages
- Published files become publicly accessible

---

## Failure Reasons & Debugging

| Error | Cause | Fix |
|-------|-------|-----|
| "Only PDF files are allowed" | Wrong file type selected | Select a .pdf file |
| "File size must be less than 50MB" | File too large | Compress or split the PDF |
| "You must be signed in to upload" | No active session | Sign in with Google |
| "Session verification failed" | Session expired | Sign out and sign in again |
| "Failed to initialize upload service" | Supabase SDK not loaded | Check network, refresh page |
| JWT/token errors | Token expired or invalid | Sign out, clear cookies, sign in again |
| RLS/policy/permission errors | Storage bucket RLS policy issue | Check Supabase Storage policies |
| Storage upload failed | Bucket doesn't exist or misconfigured | Verify bucket exists in Supabase dashboard |
| Database submission failed | Missing table or RLS policy | Check submissions table and policies |

---

## Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `uploads-temp` | Private (authenticated users) | Initial upload destination |
| `uploads-approved` | Private (admin only) | After admin approval |
| `uploads-public` | Public | Published and downloadable |

---

## Key Files

| File | Role |
|------|------|
| `upload.html` | Upload page HTML |
| `js/upload.js` | Upload page controller (auth guard, form handling) |
| `js/upload-handler.js` | Core upload logic (validation, storage, DB) |
| `js/supabase-client.js` | Storage helpers (BUCKETS, uploadFile) |
| `js/auth-controller.js` | Auth verification |
| `admin/dashboard.js` | Admin review workflow |
