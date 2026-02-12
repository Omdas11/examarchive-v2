# Review Flow

> Phase 1 — Upload → Review → Approval Pipeline

## Standard Flow

```
User uploads file
  → File saved to uploads-temp/{user_id}/{timestamp}-{filename}
  → Row inserted in submissions (status=pending, temp_path set, approved_path null)
  → Appears in reviewer panel (/admin/review.html)

Reviewer approves
  → File copied: uploads-temp → uploads-approved
  → submissions.status = 'approved', approved_path set

Reviewer rejects
  → File deleted from uploads-temp
  → submissions.status = 'rejected'
```

## Submissions Table

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `user_id` | Uploader |
| `paper_code` | Course/paper code |
| `exam_year` | Year of exam |
| `temp_path` | Path in uploads-temp bucket |
| `approved_path` | Path in uploads-approved bucket (null until approved) |
| `status` | `pending`, `approved`, or `rejected` |
| `created_at` | Upload timestamp |

## Demo Mode

In demo mode, the review step is skipped:

1. File uploaded to `uploads-temp`
2. Copy to `uploads-approved/demo/{paperCode}/{examYear}/{timestamp}-{filename}`
3. Submission inserted with `status = 'approved'` and `approved_path` set
4. Appears immediately in Browse page

## Reviewer UI

- **Page:** `/admin/review.html`
- Lists all submissions with `status = 'pending'`
- Each entry shows file details and approve/reject buttons
- Requires role level ≥ 50
