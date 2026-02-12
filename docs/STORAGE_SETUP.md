# Storage Setup

## Buckets

### uploads-temp (Private)

- **Purpose:** Temporary storage for files awaiting review
- **Public:** No
- **Insert:** Authenticated users (`auth.role() = 'authenticated'`)
- **Select:** Authenticated users (own files or reviewer+)

### uploads-approved (Public)

- **Purpose:** Permanent storage for approved papers
- **Public:** Yes (anyone can read)
- **Insert:** Reviewer+ (role level ≥ 50)
- **Read:** Public, no auth required

## File Path Format

```
{userId}/{paperCode}/{examYear}/{filename}
```

Example:
```
abc123/CS101/2025/midterm.pdf
```

## Policy Design

- No `auth.uid()` path-matching logic — policies are kept minimal
- Insert policies check authentication or role level
- Public bucket serves files directly via Supabase storage URLs

## Moving Files (Approve Flow)

When a reviewer approves a submission:

1. Download file from `uploads-temp`
2. Upload file to `uploads-approved` at the same path
3. Delete the original from `uploads-temp`
4. Update the `submissions` row to `status = 'approved'`
5. Insert a row into `approved_papers`

## Notes

- Max file size and type restrictions are enforced at the frontend upload form
- Storage policies are defined in `04_storage_policies.sql`
