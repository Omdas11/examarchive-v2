# Frontend Flow

> Phase 1 — Upload Lifecycle & Approval Logic

## Upload Lifecycle

### 1. Authentication Check

Upload page (`upload.html`) listens for `auth:ready` event. If no session, the form is disabled and the button shows "Sign in to Upload".

### 2. File Selection

- User selects upload type (Question Paper or Demo Paper)
- Enters paper code and exam year
- Selects or drags a PDF file

### 3. Upload Process

```
User clicks "Upload Paper"
  → Validate inputs (paper code, year, PDF file)
  → Refresh auth session (supabase.auth.refreshSession())
  → Upload to: uploads-temp/{user_id}/{timestamp}-{filename}
  → Insert submissions row
```

### 4. Normal Upload (Question Paper)

```
submissions.insert({
  user_id, paper_code, exam_year,
  temp_path: "{user_id}/{timestamp}-{filename}",
  approved_path: null,
  status: "pending"
})
```

File sits in `uploads-temp` until a reviewer approves it.

### 5. Demo Upload

```
1. Upload to uploads-temp
2. Copy to uploads-approved/demo/{paperCode}/{examYear}/{timestamp}-{filename}
3. submissions.insert({
     status: "approved",
     approved_path: "demo/{paperCode}/{examYear}/{timestamp}-{filename}"
   })
4. Appears immediately in Browse page
```

## Approval Logic

### Reviewer Panel (`admin/review.html`)

- Lists all submissions with `status = "pending"`
- Reviewer can approve or reject

### Approve Flow

1. Copy file from `uploads-temp` to `uploads-approved`
2. Update submission: `status = "approved"`, set `approved_path`
3. Paper appears in Browse

### Reject Flow

1. Delete file from `uploads-temp`
2. Update submission: `status = "rejected"`

## Key Files

| File | Purpose |
|---|---|
| `js/upload.js` | Upload page UI and form handling |
| `js/upload-handler.js` | Storage upload and submission logic |
| `js/auth-controller.js` | Session management |
| `js/utils/supabase-wait.js` | Wait for Supabase client |
