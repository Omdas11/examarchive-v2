# UPLOAD FLOW

**Phase 9.2 — Complete Upload Process Documentation**

This document provides a step-by-step explanation of the upload process, common failure cases, and how to debug each case.

---

## 🔄 Complete Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTIONS                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: User Navigates to Upload Page                       │
├──────────────────────────────────────────────────────────────┤
│ • User clicks "Upload" in navigation                         │
│ • Browser loads upload.html                                  │
│ • JS modules load: upload.js, upload-handler.js             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Auth Check (CRITICAL)                               │
├──────────────────────────────────────────────────────────────┤
│ • DOMContentLoaded event fires                               │
│ • requireAuth() called                                       │
│ • Supabase getSession() executed                             │
│ • Decision:                                                  │
│   ├─ NO SESSION → Show "Sign in required" message           │
│   └─ HAS SESSION → Enable upload form                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: User Fills Form                                     │
├──────────────────────────────────────────────────────────────┤
│ • User enters paper code (e.g., "PHYDSC102T")               │
│ • User enters examination year (e.g., "2023")               │
│ • User selects PDF file                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Frontend Validation                                 │
├──────────────────────────────────────────────────────────────┤
│ • Paper code: Not empty                                      │
│ • Exam year: 1990-2099                                       │
│ • File: PDF type, <50MB                                      │
│ • If invalid → Show error, stop                              │
│ • If valid → Continue                                        │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: Session Verification (CRITICAL)                     │
├──────────────────────────────────────────────────────────────┤
│ handlePaperUpload() called                                   │
│ ├─ Log: "Starting paper upload"                              │
│ ├─ await supabase.auth.getSession()                          │
│ ├─ Check session exists                                      │
│ ├─ Check no session error                                    │
│ └─ Get user ID from session                                  │
│                                                              │
│ ⚠️ CRITICAL CHECKPOINT:                                      │
│    If session invalid → STOP, show error                     │
│    If session valid → Continue to upload                     │
│                                                              │
│ 📝 NOTE (Phase 9.2.1):                                       │
│    Session verification is MANDATORY before storage calls.   │
│    This prevents anonymous uploads and "no permission"       │
│    false negatives. Always await getSession() and verify     │
│    session exists before calling storage APIs.               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: Prepare Upload                                      │
├──────────────────────────────────────────────────────────────┤
│ • Generate timestamp                                         │
│ • Sanitize filename                                          │
│ • Create storage path: {userId}/{timestamp}-{filename}      │
│ • Log: "Uploading file to storage..."                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 7: Upload to Storage                                   │
├──────────────────────────────────────────────────────────────┤
│ uploadFile(file, {                                           │
│   bucket: BUCKETS.TEMP,                                      │
│   path: storagePath,                                         │
│   onProgress: callback                                       │
│ })                                                           │
│                                                              │
│ ↓ Uses authenticated Supabase client                         │
│ ↓ JWT token automatically attached                           │
│ ↓ Storage RLS checks auth.uid()                              │
│                                                              │
│ SUCCESS → File in uploads-temp bucket                        │
│ FAILURE → Error returned                                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 8: Create Submission Record                            │
├──────────────────────────────────────────────────────────────┤
│ • Log: "Creating submission record in database..."          │
│ • Insert into 'submissions' table:                           │
│   - user_id (from session)                                   │
│   - original_filename                                        │
│   - file_size                                                │
│   - temp_path                                                │
│   - paper_code                                               │
│   - exam_year                                                │
│   - status: 'pending'                                        │
│                                                              │
│ ↓ RLS checks: auth.uid() = user_id                          │
│                                                              │
│ SUCCESS → Record created, ID returned                        │
│ FAILURE → Cleanup uploaded file, return error                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 9: Success Response                                    │
├──────────────────────────────────────────────────────────────┤
│ • Log: "Upload completed successfully"                      │
│ • Show success message to user                               │
│ • Reset form                                                 │
│ • Reload user's submissions list                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Admin Review Flow

```
┌──────────────────────────────────────────────────────────────┐
│ SUBMISSION LIFECYCLE                                         │
└──────────────────────────────────────────────────────────────┘

User Uploads
     ↓
[pending] → Admin Dashboard
     │
     ├─→ APPROVE
     │      ↓
     │   Move file: uploads-temp → uploads-public
     │      ↓
     │   Update record: status='published', public_url
     │      ↓
     │   [published]
     │
     └─→ REJECT
            ↓
         Delete file from uploads-temp
            ↓
         Update record: status='rejected', rejection_reason
            ↓
         [rejected]
```

### Admin Actions

#### Approve & Publish

1. Admin clicks "Approve & Publish"
2. Backend function moves file:
   - FROM: `uploads-temp/{userId}/{timestamp}-{filename}.pdf`
   - TO: `uploads-public/papers/{paperCode}_{year}_{timestamp}.pdf`
3. Generate public URL
4. Update submission:
   - status: 'published'
   - reviewer_id: {adminUserId}
   - reviewed_at: NOW()
   - published_at: NOW()
   - public_path: new path
   - public_url: public URL

#### Reject

1. Admin clicks "Reject"
2. Optional: Add rejection reason
3. Delete file from `uploads-temp`
4. Update submission:
   - status: 'rejected'
   - reviewer_id: {adminUserId}
   - reviewed_at: NOW()
   - rejection_reason: reason text

#### Delete

1. Admin clicks "Delete"
2. Confirm deletion
3. Delete file from all buckets (temp/approved/public)
4. Delete submission record from database

---

## ❌ Common Failure Cases

### 1. No Session / Not Signed In

**Symptom**: Upload button disabled, "Sign in required" message

**Cause**: User not authenticated

**Debug**:
```javascript
// Check console for:
logWarn(DebugModule.AUTH, 'Auth required - user not logged in');
```

**Fix**: User must sign in

**Code Location**: `js/upload.js` → `requireAuth()`

---

### 2. Session Expired / Invalid JWT

**Symptom**: Upload fails with "Your session has expired" message

**Cause**: JWT token expired or invalid

**Debug**:
```javascript
// Check console/debug panel for:
logError(DebugModule.AUTH, 'JWT token expired or invalid');
```

**Fix**: User must sign in again

**Code Location**: `js/upload-handler.js` → Session check

**Prevention**: Supabase auto-refreshes tokens, but user may have cleared storage or been signed out

---

### 3. RLS Policy Rejection

**Symptom**: Upload fails with "Permission denied" message

**Cause**: Storage RLS policy rejecting the upload

**Common Reasons**:
- User not authenticated (session lost between checks)
- Supabase client not using authenticated session
- Storage policy misconfigured

**Debug**:
```javascript
// Check console/debug panel for:
logError(DebugModule.STORAGE, 'RLS policy violation - user may not be authenticated');

// Also check Supabase dashboard:
// - Storage > Policies
// - Confirm auth.uid() IS NOT NULL policy exists
```

**Fix**:
1. Verify session is valid before upload
2. Ensure ONE Supabase client is used
3. Check storage policies in Supabase dashboard

**Code Location**: 
- `js/upload-handler.js` → Session verification
- `admin/sql/04_storage_policies.sql` → RLS policies

---

### 4. File Size Exceeded

**Symptom**: Upload fails with "File size must be less than 50MB"

**Cause**: File larger than 50MB limit

**Debug**: File size check happens in frontend validation

**Fix**: User must compress PDF or split into smaller files

**Code Location**: `js/upload-handler.js` → File validation

---

### 5. Wrong File Type

**Symptom**: Upload fails with "Only PDF files are allowed"

**Cause**: User selected non-PDF file

**Debug**: File type check happens in frontend validation

**Fix**: User must select a PDF file

**Code Location**: `js/upload-handler.js` → File validation

---

### 6. Network Error

**Symptom**: Upload fails with "Network error. Please check your connection"

**Cause**: Internet connection lost or very slow

**Debug**:
```javascript
// Check console for network errors:
// - Failed to fetch
// - net::ERR_INTERNET_DISCONNECTED
```

**Fix**: User must reconnect to internet and retry

**Code Location**: Catches in `upload-handler.js`

---

### 7. Storage Quota Exceeded

**Symptom**: Upload fails with storage error

**Cause**: Supabase storage quota exceeded

**Debug**: Check Supabase dashboard → Project Settings → Usage

**Fix**: Upgrade Supabase plan or delete old files

**Code Location**: Backend (Supabase)

---

### 8. Database Insert Failed

**Symptom**: File uploads successfully but submission record fails to create

**Cause**: Database constraint violation or RLS policy rejection

**Debug**:
```javascript
// Check console/debug panel:
logError(DebugModule.UPLOAD, 'Database submission record creation failed');

// File is automatically cleaned up from storage
```

**Fix**: 
- Check database constraints (e.g., duplicate submission)
- Verify RLS policies allow INSERT

**Code Location**: `js/upload-handler.js` → Submission creation

**Recovery**: File is automatically removed from storage to prevent orphaned files

---

## 🐛 Debugging Upload Issues

### Step-by-Step Debugging

#### 1. Enable Debug Panel (Admin Only)

1. Sign in as admin
2. Go to Settings
3. Enable "Debug Panel"
4. Return to Upload page
5. Debug panel appears in bottom-right

#### 2. Check Auth Status

```javascript
// In browser console:
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User ID:', data.session?.user?.id);
```

#### 3. Check Storage Policies

Go to Supabase Dashboard:
- Storage → uploads-temp → Policies
- Verify "Authenticated uploads only" policy exists
- Test policy with SQL:
```sql
SELECT auth.uid(); -- Should return your user ID when signed in
```

#### 4. Check RLS Policies

Go to Supabase Dashboard:
- Database → Tables → submissions
- Click on Policies tab
- Verify INSERT policy exists for authenticated users

#### 5. Monitor Network Tab

1. Open browser DevTools → Network tab
2. Attempt upload
3. Look for failed requests:
   - Storage POST request (file upload)
   - Database POST request (submission record)
4. Check response status codes:
   - 401: Unauthorized (auth issue)
   - 403: Forbidden (RLS policy rejection)
   - 413: Payload Too Large (file too big)
   - 500: Internal Server Error (backend issue)

---

## 💡 Best Practices

### For Developers

1. **Always check session before upload**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   if (!session) {
     throw new Error('Must be signed in');
   }
   ```

2. **Log critical checkpoints**
   ```javascript
   logInfo(DebugModule.UPLOAD, 'Session verified');
   logInfo(DebugModule.UPLOAD, 'File uploaded to storage');
   logInfo(DebugModule.UPLOAD, 'Submission record created');
   ```

3. **Handle errors gracefully**
   - Translate technical errors to user-friendly messages
   - Clean up on failure (remove uploaded files)
   - Log errors for debugging

4. **Test failure cases**
   - Test without signing in
   - Test with expired session
   - Test with oversized file
   - Test with wrong file type
   - Test with network disconnected

### For Users

1. **Always sign in before uploading**
2. **Ensure stable internet connection**
3. **Use PDF files only**
4. **Keep files under 50MB**
5. **Enter valid paper code and year**
6. **Wait for upload to complete (don't navigate away)**

---

## 🔐 Security Checkpoints

### Frontend Checkpoints (User Experience)

1. Auth check on page load
2. File type validation (PDF only)
3. File size validation (<50MB)
4. Form field validation

**Purpose**: Fast feedback to user

**Security Level**: ⚠️ Can be bypassed (browser tools)

### Backend Checkpoints (Security)

1. JWT token verification (automatic)
2. Storage RLS: `auth.uid() IS NOT NULL`
3. Database RLS: User can only insert with own user_id
4. Storage bucket policies

**Purpose**: Actual security enforcement

**Security Level**: 🔒 Cannot be bypassed

---

## 🚀 Upload Performance

### Typical Upload Times

| File Size | Upload Time (4G) | Upload Time (WiFi) |
|-----------|------------------|-------------------|
| 1 MB      | 2-3 seconds      | 1-2 seconds       |
| 5 MB      | 5-10 seconds     | 3-5 seconds       |
| 10 MB     | 10-20 seconds    | 5-10 seconds      |
| 20 MB     | 20-40 seconds    | 10-20 seconds     |
| 50 MB     | 50-120 seconds   | 25-50 seconds     |

### Progress Tracking

```javascript
// Upload with progress callback
await uploadFile(file, {
  bucket: BUCKETS.TEMP,
  path: storagePath,
  onProgress: (percent) => {
    console.log(`Upload progress: ${percent}%`);
    button.textContent = `Uploading ${percent}%`;
  }
});
```

---

## 📊 Upload Statistics

### Monitoring

**Admin Dashboard shows**:
- Total submissions (all time)
- Pending submissions (awaiting review)
- Approved submissions
- Rejected submissions

**Per-User View** (upload.html):
- User's own submissions only
- Status of each submission
- Upload date
- File details

---

## 🔮 Future Enhancements

### Planned Features

1. **Resumable Uploads**: For large files (>50MB)
2. **Batch Upload**: Multiple files at once
3. **Preview**: PDF preview before upload
4. **OCR**: Extract text from scanned papers
5. **Auto-metadata**: Detect paper code/year from PDF

### Technical Debt

1. Replace `waitForRole()` calls with proper role checks
2. Add upload progress persistence (resume after page refresh)
3. Implement client-side PDF validation (check if valid PDF)

---

## 📚 Related Documentation

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System design
- [FILE_MAP.md](./FILE_MAP.md) - File reference
- [DEBUG_SYSTEM_GUIDE.md](./DEBUG_SYSTEM_GUIDE.md) - Debug tools
- [ROLE_SYSTEM.md](./ROLE_SYSTEM.md) - Role management

---

**Last Updated**: Phase 9.2  
**Upload System Version**: v1 (Single file, PDF only)
