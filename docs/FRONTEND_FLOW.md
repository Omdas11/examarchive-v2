# Frontend Upload Flow

## Overview

This document describes the upload payload, the submission insert contract, and the field requirements enforced at the database level.

## Upload Payload

When a user uploads a paper, the following payload is inserted into the `submissions` table:

```javascript
await supabase.from('submissions').insert({
  user_id: userId,              // From supabase.auth.getUser() — never cached
  paper_code: metadata.paperCode, // Paper/subject code from upload form
  year: metadata.examYear,     // Examination year from upload form
  storage_path: storagePath,   // Path in uploads-temp bucket after successful upload
  original_filename: file.name, // Original filename — must not be undefined
  file_size: file.size,        // File size in bytes — must not be undefined
  content_type: file.type || 'application/pdf', // MIME type
  status: 'pending'            // 'pending' for normal uploads, 'approved' for demo papers
})
```

## Required Fields (NOT NULL)

| Field | Source | Constraint |
|---|---|---|
| `user_id` | `supabase.auth.getUser().user.id` | NOT NULL, RLS requires `auth.uid() = user_id` |
| `paper_code` | Upload form input | NOT NULL |
| `year` | Upload form input | NOT NULL |
| `storage_path` | Storage upload response path | NOT NULL |
| `original_filename` | `file.name` | NOT NULL |
| `file_size` | `file.size` | NOT NULL |
| `content_type` | `file.type` or `'application/pdf'` | NOT NULL |
| `status` | `'pending'` or `'approved'` | NOT NULL (default: `'pending'`) |

## Demo Paper Upload

Demo papers use the same payload but with `status: 'approved'`. They are also copied to the `uploads-approved` bucket immediately:

```javascript
await supabase.from('submissions').insert({
  user_id: userId,
  paper_code: metadata.paperCode,
  year: metadata.examYear,
  storage_path: storagePath,
  original_filename: file.name,
  file_size: file.size,
  content_type: file.type || 'application/pdf',
  status: 'approved'
})
```

## Error Handling

If the insert fails, the upload handler:
1. Logs `Submission insert failed:` with the full error object to the debug panel
2. Checks for RLS violations (`row-level security` or `policy` in the error message)
3. Cleans up the uploaded file from `uploads-temp` storage
4. Re-throws the error so the UI can display an appropriate message

## Step-by-Step Flow

1. **Auth Guard** — `supabase.auth.getUser()` called; upload blocked if no user
2. **Metadata Validation** — `paper_code` and `examYear` checked; error thrown if missing
3. **File Upload** — PDF uploaded to `uploads-temp/{userId}/{timestamp}-{filename}`
4. **Submission Insert** — Row inserted into `submissions` with all required fields
5. **Rollback on Failure** — If insert fails, the uploaded file is removed from storage

## Column Names

The database uses these column names consistently:
- `year` (not `exam_year`)
- `storage_path` (not `temp_path`)
- `original_filename`
- `file_size`
- `content_type`
