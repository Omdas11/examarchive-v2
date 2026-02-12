# Frontend Flow

> Phase 1.3 — Upload Lifecycle with Auth Guard

## Upload Lifecycle

### 1. Authentication Check

Upload page (`upload.html`) listens for `auth:ready` event. If no session, the form is disabled and the button shows "Sign in to Upload".

**Auth Ready Flag:**
- `authReady` flag is set when `auth:ready` event fires
- Upload button is blocked until `authReady = true`
- Prevents upload execution before authentication is initialized

**Visual Auth Indicator:**
- Header shows 🟢 "Logged In" or 🔴 "Not Logged In"
- Auto-updates on auth state changes
- Mobile: shows only colored dot

### 2. File Selection

- User selects upload type (Question Paper or Demo Paper)
- Enters paper code and exam year
- Selects or drags a PDF file

### 3. Upload Process — Auth Lock

```
User clicks "Upload Paper"
  → Check authReady flag — block if false
  → Validate inputs (paper code, year, PDF file)
  → Call handlePaperUpload()
  
Inside handlePaperUpload():
  → Print auth status to debug panel
  → await supabase.auth.getUser()
  → if (authError || !user) → BLOCK with "Please sign in"
  → const userId = user.id (ONLY source)
  → Upload to: uploads-temp/{userId}/{timestamp}-{filename}
  → Insert submissions row with userId
```

**Key Changes in Phase 1.3:**
- **Hard Auth Check:** `getUser()` called fresh before every insert
- **No cached session:** Never use `session.user.id` or `user?.id`
- **Auth ready guard:** Upload blocked until `auth:ready` event fires
- **Debug auth status:** Printed on page load and upload start

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

## Error Handling

### RLS Policy Violation

If `user_id` is NULL or mismatched, RLS blocks the insert:

```
Error message includes "row-level security" or "policy"
  → Show: "Upload blocked by permission policy. Please re-login."
  → Log to debug panel: "[RLS] Insert blocked. user_id mismatch or policy violation."
```

**Not shown:** Generic "Permission denied" — exact RLS cause is surfaced.

### Auth Errors

```
authError || !user
  → Show: "Please sign in before uploading."
  → Log: "[AUTH] User not authenticated. Blocking upload."
```

### Storage Errors

```
403 Forbidden
  → Show: "Storage permission denied. Please ensure you are signed in."
  
404 Not Found
  → Show: "Storage bucket not found. Please contact the administrator."
```

## Debug Panel

Open the debug panel (🐛 icon at bottom) to see:

### Auth Status (Printed automatically)

```
[AUTH] Session Status: Logged In
[AUTH] User ID: 12345678-abcd-1234-5678-abcdef012345
[AUTH] Role Level: 10
```

Printed:
- On page load (`auth:ready` event)
- When debug panel opens
- At upload start

### Upload Flow Logs

```
[upload] Starting paper upload
[AUTH] Active user: 12345678-abcd-1234-5678-abcdef012345
[upload] 📤 Storage Upload Starting
[upload] ✅ Storage Upload Complete
[upload] 📝 Submission Insert Starting (Pending Review)
[upload] ✅ Submission Insert Complete (Pending Review)
```

## Upload Lock

**Duplicate Prevention:**
- `isUploading` flag prevents concurrent uploads
- Set to `true` when upload starts, `false` when complete
- User sees "Upload already in progress" if clicked again

**Auth Ready Prevention:**
- `authReady` flag prevents upload before auth initialized
- User sees "Authentication still loading. Please wait."

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
