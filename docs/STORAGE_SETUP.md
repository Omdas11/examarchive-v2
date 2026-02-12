# Storage Setup

> Phase 1 — Two-Bucket Architecture

## Buckets

### uploads-temp (Private)

- **Purpose:** Temporary storage for files awaiting review
- **Public:** No
- **Insert:** Authenticated users
- **Select:** Authenticated users (own files or reviewer+)

### uploads-approved (Public)

- **Purpose:** Permanent storage for approved papers
- **Public:** Yes (anyone can read)
- **Insert:** Reviewer+ (role level ≥ 50) or system (demo auto-approve)
- **Read:** Public, no auth required

## File Path Format

```
uploads-temp:     {userId}/{timestamp}-{filename}
uploads-approved: {paperCode}/{examYear}/{timestamp}-{filename}
                  demo/{paperCode}/{examYear}/{timestamp}-{filename}  (demo uploads)
```

## Approval Flow (File Movement)

1. Download file from `uploads-temp`
2. Upload to `uploads-approved`
3. Delete original from `uploads-temp`
4. Update `submissions.status = 'approved'` and set `approved_path`

## Notes

- Max file size: 50MB (enforced in frontend)
- Only PDF files accepted
- Storage policies in `admin/sql/04_storage_policies.sql`
