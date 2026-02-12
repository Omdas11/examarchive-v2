# Review Flow

## Standard Flow

```
User uploads file
  → File saved to uploads-temp
  → Row inserted in submissions (status=pending)
  → Appears in reviewer panel (/admin/review.html)

Reviewer approves
  → File moved: uploads-temp → uploads-approved
  → Row inserted in approved_papers
  → submissions.status = 'approved'

Reviewer rejects
  → File deleted from uploads-temp
  → submissions.status = 'rejected'
```

## Submissions Table

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `user_id` | Uploader |
| `file_path` | Path in storage bucket |
| `paper_code` | Course/paper code |
| `exam_year` | Year of exam |
| `status` | `pending`, `approved`, or `rejected` |
| `created_at` | Upload timestamp |

## Demo Mode

In demo mode, the review step is skipped:

1. File uploads directly to `uploads-approved`
2. Row inserted in `approved_papers` immediately
3. `submissions.status` set to `approved` on creation
4. No reviewer action needed

## Reviewer UI

- **Page:** `/admin/review.html`
- Lists all submissions with `status = 'pending'`
- Each entry shows file details and approve/reject buttons
- Requires role level ≥ 50

## Approved Papers Table

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `submission_id` | Links to submissions table |
| `file_url` | Public URL in uploads-approved |
| `paper_code` | Course/paper code |
| `exam_year` | Year of exam |
| `created_at` | Approval timestamp |

Papers in this table are visible on `browse.html` and `paper.html`.
