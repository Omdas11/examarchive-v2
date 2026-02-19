# Storage Flow

## Buckets

| Bucket | Access | Purpose |
|---|---|---|
| `uploads-temp` | Private (authenticated users) | Temporary storage for new uploads |
| `uploads-approved` | Public (read-only) | Approved papers available for browsing |

## Upload Flow

### Step 1: File Upload to Storage

```
User selects PDF → Frontend validates (PDF only, < 50MB)
                 → Uploads to uploads-temp/{user_id}/{timestamp}-{filename}
```

### Step 2: Submission Record

```
Frontend inserts into submissions table:
  - user_id: from fresh getUser() call
  - paper_code: user input
  - exam_year: user input
  - temp_path: storage path in uploads-temp
  - status: 'pending'
```

### Step 3: Review (Normal Papers)

```
Reviewer sees pending submission → Downloads from uploads-temp
                                 → Approves: copies to uploads-approved, updates status
                                 → Rejects: updates status, optionally deletes temp file
```

### Step 4: Approval

```
Approved paper → copied to uploads-approved/{paper_code}/{year}/{filename}
              → approved_path updated in submissions table
              → Paper visible in Browse page
```

## Demo Papers

Demo papers skip the review process:

1. Upload to `uploads-temp` as normal
2. Immediately copy to `uploads-approved/demo/{paper_code}/{year}/{filename}`
3. Create submission with `status: 'approved'` and `approved_path` set
4. Paper is immediately visible in Browse

## File Path Format

| Type | Path |
|---|---|
| Temp upload | `uploads-temp/{user_id}/{timestamp}-{filename}` |
| Approved paper | `uploads-approved/{paper_code}/{year}/{filename}` |
| Demo paper | `uploads-approved/demo/{paper_code}/{year}/{filename}` |

## Rollback Handling

If the database insert fails after file upload:

1. The uploaded file is deleted from `uploads-temp`
2. Error is logged to debug panel with `[STORAGE]` or `[RLS]` tag
3. User sees a human-readable error message

```javascript
// Rollback: clean up uploaded file on DB insert failure
if (submissionError) {
  await supabase.storage.from('uploads-temp').remove([storagePath]);
  throw submissionError;
}
```

## Storage Policies

### uploads-temp

- **Insert:** Authenticated users can upload files to their own path
- **Select:** Authenticated users can read their own files; Reviewers can read all
- **Delete:** Authenticated users can delete their own files; Reviewers can delete all

### uploads-approved

- **Select:** Public read access (anyone can download approved papers)
- **Insert:** Reviewers and Admins only (level ≥ 80)
- **Delete:** Admins only (level ≥ 100)

## Constraints

- Maximum file size: **50 MB**
- Allowed file type: **PDF only**
- Filenames are sanitized (non-alphanumeric characters replaced with `_`)
