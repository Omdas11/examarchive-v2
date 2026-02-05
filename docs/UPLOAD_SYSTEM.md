# Upload System Documentation

> **Phase:** 9.2  
> **Last Updated:** 2026-02-05  
> **Status:** CANONICAL — Single source of truth for upload implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Upload Flow](#upload-flow)
5. [Authentication Integration](#authentication-integration)
6. [File Validation](#file-validation)
7. [Supabase Storage Integration](#supabase-storage-integration)
8. [Upload States & Lifecycle](#upload-states--lifecycle)
9. [User Submissions Tracking](#user-submissions-tracking)
10. [Error Handling](#error-handling)
11. [Security Model](#security-model)
12. [API Reference](#api-reference)
13. [Debugging Guide](#debugging-guide)
14. [Admin Review Workflow](#admin-review-workflow)

---

## Overview

ExamArchive's upload system allows authenticated users to contribute question papers to the archive. The system follows a **review-approve-publish** workflow with multi-stage storage and comprehensive tracking.

### Key Principles

1. **Auth-First** — Only authenticated users can upload
2. **Three-Bucket Architecture** — Temp → Approved → Public progression
3. **Review Before Publication** — All uploads require admin approval
4. **Comprehensive Tracking** — Full audit trail from upload to publication
5. **User-Friendly Feedback** — Clear status updates and error messages

### System Capabilities

- ✅ PDF upload with drag-and-drop support
- ✅ Real-time validation (type, size)
- ✅ Metadata capture (paper code, exam year)
- ✅ Progress tracking during upload
- ✅ Submission status monitoring
- ✅ Admin review workflow
- 🔜 Repeated questions upload (Phase 10)
- 🔜 Notes/resources upload (Phase 11)

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                            │
│                 upload.html + upload.js                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐       │
│  │ Type       │  │ Form       │  │ File Drop       │       │
│  │ Selector   │  │ Metadata   │  │ Zone            │       │
│  └────────────┘  └────────────┘  └─────────────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               UPLOAD HANDLER (upload-handler.js)             │
│  - File validation                                           │
│  - Auth verification                                         │
│  - Storage upload                                            │
│  - Database record creation                                  │
│  - Error handling                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  Supabase      │ │  Supabase      │ │  Auth          │
│  Storage       │ │  Database      │ │  Controller    │
│  (3 buckets)   │ │  (submissions) │ │  (session)     │
└────────────────┘ └────────────────┘ └────────────────┘
```

### Three-Bucket Storage Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    STORAGE BUCKETS                            │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ uploads-temp    │  │ uploads-approved│  │ uploads-     │ │
│  │ (Private)       │  │ (Private)       │  │ public       │ │
│  │                 │  │                 │  │ (Public)     │ │
│  │ User uploads    │  │ Admin-approved  │  │ Published    │ │
│  │ pending review  │  │ pending publish │  │ PDFs         │ │
│  │                 │  │                 │  │              │ │
│  │ {userId}/       │  │ {paperCode}/    │  │ papers/      │ │
│  │ {timestamp}-    │  │ {year}-         │  │ {paperCode}/ │ │
│  │ {filename}.pdf  │  │ {filename}.pdf  │  │ {year}.pdf   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│         │                    │                    │           │
│         │ Admin approves     │ Admin publishes    │           │
│         └──────────────────> └──────────────────> │           │
│                                                    │           │
└────────────────────────────────────────────────────┼───────────┘
                                                     │
                                                     ▼
                                            ┌────────────────┐
                                            │ Public CDN URL │
                                            │ (read-only)    │
                                            └────────────────┘
```

### File Structure

```
js/
├── upload-handler.js          # Core upload logic and storage integration
├── upload.js                  # UI controller for upload page
├── supabase-client.js         # Storage helper functions
├── auth-controller.js         # Auth state management
└── utils/
    └── supabase-wait.js       # Supabase initialization utility

upload.html                    # Upload page UI

admin/sql/
├── 02_submissions_table.sql   # Database schema
├── 03_storage_buckets.sql     # Bucket configuration
└── 04_storage_policies.sql    # RLS policies
```

---

## Core Components

### 1. Upload Page (`upload.html`)

**Purpose:** User interface for uploading papers

**Features:**
- Upload type selector (Question Papers, Repeated Questions, Notes)
- Paper metadata form (paper code, exam year)
- File drag-and-drop zone
- Submit button with progress indicator
- User submissions list

**Authentication Guard:**
```html
<!-- Auth dependencies loaded first -->
<script src="js/utils/supabase-wait.js"></script>
<script src="js/auth-controller.js"></script>
<script src="js/upload-handler.js"></script>
<script src="js/upload.js"></script>
```

---

### 2. Upload Controller (`js/upload.js`)

**Purpose:** Page-level logic and UI state management

**Responsibilities:**
1. Wait for `auth:ready` event
2. Render auth-required UI if not signed in
3. Initialize upload form and drag-drop
4. Validate user inputs
5. Call `UploadHandler.handlePaperUpload()`
6. Display upload progress and results
7. Load and render user submissions

**Key Functions:**

```javascript
// Wait for auth before initializing
window.addEventListener("auth:ready", async (e) => {
  const session = e.detail.session;
  
  if (!session) {
    renderSignInRequired();
  } else {
    initializeUploadForm();
    loadUserSubmissions();
  }
});

// Handle file upload
uploadButton.addEventListener('click', async () => {
  const result = await handlePaperUpload(
    selectedFile,
    { paperCode, examYear },
    (progress) => updateProgress(progress)
  );
});
```

---

### 3. Upload Handler (`js/upload-handler.js`)

**Purpose:** Core upload logic and Supabase integration

**Responsibilities:**
1. Validate file type and size
2. Wait for Supabase client initialization
3. Verify authenticated session
4. Upload file to temp storage
5. Create submission record in database
6. Handle errors with cleanup
7. Provide user-friendly error messages

**Architecture:**

```javascript
window.UploadHandler = {
  handlePaperUpload,      // Main upload function
  getUserSubmissions,     // Get user's uploads
  getPendingSubmissions,  // Get pending uploads (admin)
  getSubmission,          // Get single submission by ID
  formatFileSize,         // Helper: format bytes
  formatDate              // Helper: format timestamps
};
```

---

### 4. Supabase Client (`js/supabase-client.js`)

**Purpose:** Storage helper functions

**Provides:**
- `uploadFile()` — Upload with progress tracking
- `getPublicUrl()` — Get public URL for published files
- `getSignedUrl()` — Get temporary URL for private files
- `moveFile()` — Move between buckets (admin workflow)
- `deleteFile()` — Delete from storage
- `copyFile()` — Copy between buckets

**Constants:**
```javascript
const BUCKETS = {
  TEMP: 'uploads-temp',
  APPROVED: 'uploads-approved',
  PUBLIC: 'uploads-public'
};
```

---

## Upload Flow

### Complete Upload Sequence

```
1. USER OPENS UPLOAD PAGE
   ├─> Page loads, shows loading state
   ├─> Waits for auth:ready event
   └─> Checks session
       ├─> No session → Show "Sign in required"
       └─> Has session → Initialize form

2. USER FILLS FORM
   ├─> Selects upload type (Question Paper only for now)
   ├─> Enters paper code (e.g., "PHYDSC102T")
   ├─> Enters exam year (e.g., "2023")
   └─> Selects/drops PDF file

3. VALIDATION (Client-Side)
   ├─> Check paper code not empty
   ├─> Check year is 1990-2099
   ├─> Check file is PDF
   └─> Check file size < 50MB

4. UPLOAD INITIATION
   ├─> Disable upload button
   ├─> Show "Uploading..." with progress
   └─> Call UploadHandler.handlePaperUpload()

5. UPLOAD HANDLER PROCESS
   ├─> Wait for Supabase client ready
   ├─> Verify authenticated session
   │   └─> HARD FAIL if no session
   ├─> Sanitize filename
   ├─> Generate storage path: {userId}/{timestamp}-{filename}
   ├─> Upload to uploads-temp bucket
   │   └─> Update progress callback
   ├─> Create submission record in database
   │   ├─> Store metadata (paper_code, exam_year)
   │   ├─> Set status = 'pending'
   │   └─> Link to user_id
   └─> Return result

6. UPLOAD RESULT
   ├─> Success
   │   ├─> Show success message
   │   ├─> Reset form
   │   └─> Reload submissions list
   └─> Failure
       ├─> Show error message
       ├─> Re-enable upload button
       └─> Log error details

7. BACKGROUND (ADMIN)
   ├─> Admin reviews pending submission
   ├─> Approves → Move to uploads-approved
   ├─> Publishes → Move to uploads-public
   │   └─> Update submission record
   └─> Rejects → Mark rejected, delete temp file
```

---

## Authentication Integration

### How Upload Uses Auth

The upload system depends on **AuthController** for authentication state.

#### Auth Event Flow

```
┌────────────────────────────────────────────────────────┐
│  Page Load                                             │
└────────────┬───────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  auth-controller.js initializes                        │
│  - Waits for Supabase client                           │
│  - Gets current session                                │
│  - Sets up auth state listener                         │
└────────────┬───────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Emits 'auth:ready' event                              │
│  detail: { session: Session|null }                     │
└────────────┬───────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  upload.js receives event                              │
│  if (session) {                                        │
│    → Initialize upload form                            │
│    → Load user submissions                             │
│  } else {                                              │
│    → Show "Sign in required" UI                        │
│  }                                                     │
└────────────────────────────────────────────────────────┘
```

#### Code Example

```javascript
// upload.js listens for auth:ready
window.addEventListener("auth:ready", async (e) => {
  const session = e.detail.session;
  
  if (!session) {
    console.log("🔒 Upload page access denied - user not authenticated");
    renderSignInRequired();
  } else {
    console.log("✅ User authenticated, upload page ready");
    hideLoadingState();
    initializeUploadForm();
    loadUserSubmissions();
  }
});
```

#### Session Verification in Upload Handler

```javascript
async function handlePaperUpload(file, metadata, onProgress) {
  // CRITICAL: Wait for Supabase to be ready
  const supabase = await window.waitForSupabase();
  if (!supabase) {
    throw new Error('Failed to initialize upload service');
  }

  // CRITICAL: Wait for session to be ready
  const { data: { session }, error: sessionError } = 
    await supabase.auth.getSession();
  
  if (sessionError) {
    throw new Error('Session verification failed');
  }

  // 🧨 HARD FAIL IF NO SESSION
  if (!session) {
    throw new Error('You must be signed in to upload');
  }

  const userId = session.user.id;
  // Continue with upload...
}
```

### Why This Pattern?

1. **Race-Condition Free** — Page waits for auth initialization
2. **Single Source of Truth** — AuthController manages all auth state
3. **User-Initiated Sign-In** — No automatic OAuth popups
4. **Backend Verified** — Every upload checks session with Supabase

---

## File Validation

### Client-Side Validation

**Performed Before Upload:**

```javascript
// 1. File type validation
if (!file || file.type !== 'application/pdf') {
  throw new Error('Only PDF files are allowed');
}

// 2. File size validation (50MB limit)
if (file.size > 50 * 1024 * 1024) {
  throw new Error('File size must be less than 50MB');
}

// 3. Paper code validation
if (!metadata.paperCode || !metadata.paperCode.trim()) {
  throw new Error('Paper code is required');
}

// 4. Exam year validation
if (!metadata.examYear || 
    metadata.examYear < 1990 || 
    metadata.examYear > 2099) {
  throw new Error('Valid examination year required (1990-2099)');
}

// 5. Filename sanitization
function sanitizeFilename(filename) {
  const name = filename.split('/').pop().split('\\').pop();
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}
```

### Size Limits

| Limit Type | Value | Enforced By |
|------------|-------|-------------|
| Max file size | 50 MB | Client + Server |
| Allowed types | PDF only | Client + Storage |
| Paper code | Required | Client |
| Exam year | 1990-2099 | Client |

### Server-Side Validation

**Supabase Storage Configuration:**

```sql
-- Bucket: uploads-temp
-- - File size limit: 50MB
-- - Allowed MIME types: application/pdf
-- - Visibility: private
```

**RLS Policies** (see [Security Model](#security-model))

---

## Supabase Storage Integration

### Bucket Configuration

#### 1. `uploads-temp` (Private)

**Purpose:** User uploads pending review

**Configuration:**
- Visibility: Private
- Size limit: 50 MB
- MIME types: `application/pdf`
- Path structure: `{userId}/{timestamp}-{filename}.pdf`

**RLS Policies:**
- ✅ Authenticated users can upload to their own folder
- ✅ Users can read their own uploads
- ✅ Admins can read all uploads
- ✅ Users can delete their own uploads
- ✅ Admins can delete any upload

#### 2. `uploads-approved` (Private)

**Purpose:** Admin-approved PDFs awaiting publication

**Configuration:**
- Visibility: Private
- Size limit: 50 MB
- MIME types: `application/pdf`
- Path structure: `{paperCode}/{year}-{filename}.pdf`

**RLS Policies:**
- ✅ Only admins can write
- ✅ Only admins can read
- ✅ Only admins can delete

#### 3. `uploads-public` (Public)

**Purpose:** Published PDFs available to all users

**Configuration:**
- Visibility: Public
- Size limit: 50 MB
- MIME types: `application/pdf`
- Path structure: `papers/{paperCode}/{year}.pdf`

**RLS Policies:**
- ✅ Only admins can write
- ✅ Anyone can read (no policy needed, handled by bucket visibility)
- ✅ Only admins can delete

### Upload Flow Across Buckets

```
USER UPLOAD
    │
    ▼
┌─────────────────────┐
│  uploads-temp       │ ← Initial upload
│  {userId}/1234.pdf  │
└─────────────────────┘
    │
    │ Admin reviews
    │ and approves
    ▼
┌─────────────────────┐
│  uploads-approved   │ ← Moved by admin
│  PHYS102/2023.pdf   │
└─────────────────────┘
    │
    │ Admin publishes
    │
    ▼
┌─────────────────────┐
│  uploads-public     │ ← Moved by admin
│  papers/PHYS102/    │
│  2023.pdf           │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Public CDN URL     │ ← Accessible to all
│  https://...        │
└─────────────────────┘
```

### Storage Helper Functions

```javascript
// Upload file with progress
const result = await window.SupabaseClient.uploadFile(file, {
  bucket: 'uploads-temp',
  path: `${userId}/${timestamp}-${filename}`,
  onProgress: (percent) => console.log(`${percent}%`)
});

// Get public URL (for public bucket)
const url = window.SupabaseClient.getPublicUrl(path);

// Get signed URL (for private buckets)
const signedUrl = await window.SupabaseClient.getSignedUrl(
  'uploads-approved', 
  path, 
  3600  // expires in 1 hour
);

// Move between buckets (admin operation)
await window.SupabaseClient.moveFile(
  'uploads-temp', tempPath,
  'uploads-approved', approvedPath
);

// Delete file
await window.SupabaseClient.deleteFile('uploads-temp', path);
```

---

## Upload States & Lifecycle

### Submission States

| State | Description | Visible To | Actions Available |
|-------|-------------|------------|-------------------|
| `pending` | Uploaded, awaiting review | User, Admin | Admin: Approve, Reject |
| `approved` | Reviewed and approved | User, Admin | Admin: Publish, Reject |
| `rejected` | Not accepted | User, Admin | None |
| `published` | Live on platform | Everyone | Admin: Unpublish |

### State Transitions

```
┌─────────┐
│ pending │ ← User uploads
└────┬────┘
     │
     ├──── Admin reviews ────┐
     │                       │
     ▼                       ▼
┌──────────┐           ┌──────────┐
│ approved │           │ rejected │
└────┬─────┘           └──────────┘
     │                       │
     │ Admin publishes       │ (End state)
     │                       │
     ▼                       
┌───────────┐          
│ published │          
└───────────┘          
     │
     │ (End state - or can be unpublished)
     │
```

### Database Schema

```sql
create table submissions (
  id uuid primary key,
  user_id uuid references auth.users(id),
  
  -- File metadata
  original_filename text not null,
  file_size bigint,
  content_type text default 'application/pdf',
  
  -- Storage paths
  temp_path text,           -- Path in uploads-temp
  approved_path text,       -- Path in uploads-approved
  public_path text,         -- Path in uploads-public
  public_url text,          -- CDN URL (when published)
  
  -- Paper metadata
  paper_code text,
  paper_name text,
  exam_year integer,
  university text,
  programme text,
  subject text,
  
  -- Status tracking
  status text default 'pending',
    check (status in ('pending', 'approved', 'rejected', 'published')),
  
  -- Review info
  reviewer_id uuid references auth.users(id),
  review_notes text,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  published_at timestamp with time zone
);
```

### Lifecycle Timeline

```
created_at
    │
    │ User uploads
    │
    ▼
┌──────────────────────┐
│ status = 'pending'   │
│ temp_path = "..."    │
└──────────────────────┘
    │
    │ (Hours/days later)
    │
reviewed_at
    │
    │ Admin reviews
    │
    ▼
┌──────────────────────┐
│ status = 'approved'  │
│ approved_path = "..." │
│ reviewer_id = admin  │
│ review_notes = "..."  │
└──────────────────────┘
    │
    │ (Minutes later)
    │
published_at
    │
    │ Admin publishes
    │
    ▼
┌──────────────────────┐
│ status = 'published' │
│ public_path = "..."   │
│ public_url = "..."    │
└──────────────────────┘
```

---

## User Submissions Tracking

### User View

Users can see their own submissions with status updates.

#### UI Rendering

```javascript
async function loadUserSubmissions() {
  const submissions = await window.UploadHandler.getUserSubmissions();
  
  if (submissions.length === 0) {
    // No submissions yet
    return;
  }

  // Render submissions list
  submissions.forEach(submission => {
    renderSubmission(submission);
  });
}

function renderSubmission(submission) {
  const statusText = {
    pending: '⏳ Pending Review',
    approved: '✓ Approved',
    rejected: '✗ Rejected',
    published: '🌐 Published'
  };

  return `
    <div class="submission-item">
      <strong>${submission.paper_code}</strong>
      <span>${submission.exam_year}</span>
      <span class="status">${statusText[submission.status]}</span>
      <div>${submission.original_filename}</div>
      <div class="date">${formatDate(submission.created_at)}</div>
      ${submission.review_notes ? 
        `<div class="review-notes">${submission.review_notes}</div>` : ''}
    </div>
  `;
}
```

#### Status Colors

```javascript
const statusColors = {
  pending: '#FFA726',    // Orange
  approved: '#4CAF50',   // Green
  rejected: '#f44336',   // Red
  published: '#2196F3'   // Blue
};
```

### API Functions

```javascript
// Get all submissions for current user
const submissions = await window.UploadHandler.getUserSubmissions();

// Get submissions by status
const pending = await window.UploadHandler.getUserSubmissions('pending');
const published = await window.UploadHandler.getUserSubmissions('published');

// Get single submission
const submission = await window.UploadHandler.getSubmission(submissionId);
```

---

## Error Handling

### Error Categories

#### 1. Validation Errors (Client-Side)

**Examples:**
- Invalid file type (not PDF)
- File size exceeds 50MB
- Missing paper code or exam year

**Handling:**
```javascript
if (!file || file.type !== 'application/pdf') {
  showMessage('Only PDF files are allowed', 'error');
  return;
}
```

#### 2. Authentication Errors

**Examples:**
- User not signed in
- Session expired
- JWT token invalid

**Handling:**
```javascript
if (!session) {
  throw new Error('You must be signed in to upload');
}

// User-friendly message
if (error.message?.includes('JWT')) {
  userMessage = 'Your session has expired. Please sign in again.';
}
```

#### 3. Storage Errors

**Examples:**
- RLS policy violation
- Bucket not found
- Network error during upload

**Handling:**
```javascript
try {
  const { data, error } = await supabase.storage
    .from(TEMP_BUCKET)
    .upload(storagePath, file);
    
  if (error) throw error;
} catch (error) {
  if (error.message?.includes('RLS') || error.message?.includes('policy')) {
    userMessage = 'Permission denied. Please ensure you are signed in.';
  }
}
```

#### 4. Database Errors

**Examples:**
- Failed to create submission record
- Foreign key violation
- Constraint violation

**Handling:**
```javascript
const { data, error } = await supabase
  .from('submissions')
  .insert({ ... });

if (error) {
  // Clean up uploaded file
  await supabase.storage
    .from(TEMP_BUCKET)
    .remove([storagePath]);
    
  throw error;
}
```

### Error Recovery

#### Automatic Cleanup

If submission record creation fails, uploaded file is automatically deleted:

```javascript
if (submissionError) {
  console.log('Database error, cleaning up uploaded file...');
  
  // Remove file from storage
  await supabase.storage
    .from(TEMP_BUCKET)
    .remove([storagePath]);
    
  throw submissionError;
}
```

#### User-Friendly Messages

```javascript
function getUserFriendlyError(error) {
  if (error.message?.includes('JWT')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  if (error.message?.includes('RLS') || error.message?.includes('policy')) {
    return 'Permission denied. Please ensure you are signed in and try again.';
  }
  
  if (error.message?.includes('storage')) {
    return 'File storage error. Please try again or contact support.';
  }
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Return original message if it's already friendly
  const friendlyKeywords = ['PDF', 'size', 'signed in', 'allowed', 'refresh'];
  if (friendlyKeywords.some(term => error.message.includes(term))) {
    return error.message;
  }
  
  return 'Upload failed. Please try again.';
}
```

### Error Logging

```javascript
// Safe logging that works before Debug module loads
function safeLogError(module, message, data) {
  if (window.Debug && window.Debug.logError) {
    window.Debug.logError(module, message, data);
  } else {
    console.error(`[${module.toUpperCase()}] ${message}`, data || '');
  }
}

// Usage
safeLogError('upload', 'Upload failed', { error: error.message });
```

---

## Security Model

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      UNTRUSTED                               │
│                    Frontend Code                             │
│  - Cannot bypass file validation                             │
│  - Cannot write to approved/public buckets                   │
│  - Cannot access other users' uploads                        │
│  - Cannot modify submission status                           │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ JWT Token + RLS
                             │
┌─────────────────────────────────────────────────────────────┐
│                      TRUSTED                                 │
│               Supabase Backend + RLS Policies                │
│  - Validates JWT on every request                            │
│  - Enforces RLS policies                                     │
│  - Restricts bucket access                                   │
│  - Validates user_id matches auth.uid()                      │
└─────────────────────────────────────────────────────────────┘
```

### Row Level Security (RLS) Policies

#### Storage Policies (`uploads-temp`)

```sql
-- Authenticated users can upload to their own folder
create policy "authenticated users upload temp"
on storage.objects for insert
with check (
  bucket_id = 'uploads-temp'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own temp uploads
create policy "users read own temp uploads"
on storage.objects for select
using (
  bucket_id = 'uploads-temp'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all temp uploads
create policy "admins read all temp uploads"
on storage.objects for select
using (
  bucket_id = 'uploads-temp'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Users can delete their own temp uploads
create policy "users delete own temp uploads"
on storage.objects for delete
using (
  bucket_id = 'uploads-temp'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Submissions Table Policies

```sql
-- Users can see their own submissions
create policy "users see own submissions"
on submissions for select
using (auth.uid() = user_id);

-- Users can insert their own submissions
create policy "users insert own submissions"
on submissions for insert
with check (auth.uid() = user_id);

-- Admins and reviewers can see all submissions
create policy "admins and reviewers see all submissions"
on submissions for select
using (
  exists (
    select 1 from profiles
    where id = auth.uid() 
    and role in ('admin', 'reviewer')
  )
);

-- Only admins can update submissions (approve/reject)
create policy "admins manage submissions"
on submissions for update
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
```

### Security Principles

1. **User Isolation**
   - Users can only upload to `{userId}/` folder in temp bucket
   - Users can only see their own submissions
   - Path validation prevents directory traversal

2. **Admin-Only Publishing**
   - Only admins can move files to approved/public buckets
   - Only admins can change submission status
   - Reviewers can view but not modify

3. **Backend Validation**
   - All permissions checked by Supabase RLS
   - Frontend cannot bypass security checks
   - JWT token required for all operations

4. **No Secrets in Frontend**
   - Only public Supabase anon key in code
   - RLS policies protect data access
   - User identity from JWT, not frontend

### Attack Prevention

| Attack Vector | Prevention |
|---------------|------------|
| Unauthorized upload | RLS policy checks `auth.role() = 'authenticated'` |
| Upload to wrong folder | RLS policy checks `foldername = auth.uid()` |
| Access other users' files | RLS policy checks `user_id = auth.uid()` |
| Bypass file size limit | Supabase enforces bucket size limits |
| Upload non-PDF | Bucket MIME type restrictions |
| Change submission status | Update policy requires admin role |
| Publish without approval | Write policy on public bucket requires admin |
| SQL injection | Supabase parameterized queries |
| XSS in filename | Filename sanitized before storage |

---

## API Reference

### UploadHandler Public API

#### `handlePaperUpload(file, metadata, onProgress)`

Upload a paper to the system.

**Parameters:**
- `file` (File) — PDF file to upload
- `metadata` (Object)
  - `paperCode` (string) — Paper/subject code (e.g., "PHYDSC102T")
  - `examYear` (number) — Examination year (1990-2099)
  - `paperName` (string, optional) — Full paper name
- `onProgress` (Function) — Callback with progress percentage

**Returns:** `Promise<Object>`
```javascript
{
  success: boolean,
  submissionId: string|null,
  message: string,
  error: Error|null
}
```

**Example:**
```javascript
const result = await window.UploadHandler.handlePaperUpload(
  pdfFile,
  {
    paperCode: 'PHYDSC102T',
    examYear: 2023
  },
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);

if (result.success) {
  console.log('Upload successful:', result.submissionId);
} else {
  console.error('Upload failed:', result.message);
}
```

---

#### `getUserSubmissions(status?)`

Get current user's submissions.

**Parameters:**
- `status` (string, optional) — Filter by status: `'pending'`, `'approved'`, `'rejected'`, `'published'`

**Returns:** `Promise<Array<Submission>>`

**Example:**
```javascript
// Get all submissions
const allSubmissions = await window.UploadHandler.getUserSubmissions();

// Get only pending submissions
const pending = await window.UploadHandler.getUserSubmissions('pending');

// Render submissions
allSubmissions.forEach(submission => {
  console.log(submission.paper_code, submission.status);
});
```

---

#### `getPendingSubmissions()`

Get all pending submissions (admin/reviewer only).

**Returns:** `Promise<Array<Submission>>`

**Example:**
```javascript
// Admin dashboard
const pending = await window.UploadHandler.getPendingSubmissions();

pending.forEach(submission => {
  console.log(submission.id, submission.user_id, submission.paper_code);
});
```

---

#### `getSubmission(submissionId)`

Get a single submission by ID.

**Parameters:**
- `submissionId` (string) — Submission UUID

**Returns:** `Promise<Submission|null>`

**Example:**
```javascript
const submission = await window.UploadHandler.getSubmission(
  '123e4567-e89b-12d3-a456-426614174000'
);

if (submission) {
  console.log('Status:', submission.status);
  console.log('Uploaded by:', submission.profiles.email);
}
```

---

### Helper Functions

#### `formatFileSize(bytes)`

Format file size for display.

```javascript
const size = window.UploadHandler.formatFileSize(1234567);
// Returns: "1.18 MB"
```

#### `formatDate(timestamp)`

Format timestamp for display (relative or absolute).

```javascript
const date = window.UploadHandler.formatDate('2023-06-15T10:30:00Z');
// Returns: "2 days ago" or "Jun 15, 2023"
```

---

## Debugging Guide

### Common Issues

#### Issue 1: "You must be signed in to upload"

**Symptom:** Upload fails immediately with auth error

**Causes:**
1. User not signed in
2. Session expired
3. Auth not initialized before upload

**Debug Steps:**
```javascript
// 1. Check if user is signed in
console.log('Session:', window.AuthController.getSession());

// 2. Check if auth is ready
window.addEventListener('auth:ready', (e) => {
  console.log('Auth ready, session:', e.detail.session);
});

// 3. Force session refresh
const { data: { session } } = await window.__supabase__.auth.getSession();
console.log('Fresh session:', session);
```

**Solution:**
- Ensure user signs in before uploading
- Wait for `auth:ready` event before enabling upload
- Check browser console for auth errors

---

#### Issue 2: "RLS policy violation" or "Permission denied"

**Symptom:** Upload fails with permission error

**Causes:**
1. User not authenticated (JWT missing)
2. Trying to upload to wrong bucket
3. RLS policies not applied
4. User trying to access another user's folder

**Debug Steps:**
```javascript
// 1. Verify JWT token is being sent
const supabase = await window.waitForSupabase();
const { data: { session } } = await supabase.auth.getSession();
console.log('User ID:', session?.user?.id);
console.log('JWT:', session?.access_token);

// 2. Check upload path
const userId = session.user.id;
const path = `${userId}/1234-test.pdf`;
console.log('Upload path:', path);

// 3. Test storage access
const { data, error } = await supabase.storage
  .from('uploads-temp')
  .upload(path, testFile);
  
console.log('Upload result:', { data, error });
```

**Solution:**
- Ensure RLS policies are applied in Supabase dashboard
- Check that upload path starts with `{userId}/`
- Verify user is authenticated before uploading

---

#### Issue 3: "File not showing in submissions"

**Symptom:** Upload succeeds but submission not visible

**Causes:**
1. Database insert failed silently
2. Querying wrong user_id
3. RLS policy preventing read

**Debug Steps:**
```javascript
// 1. Check upload result
const result = await handlePaperUpload(file, metadata, onProgress);
console.log('Upload result:', result);

// 2. Query submissions directly
const supabase = await window.waitForSupabase();
const { data, error } = await supabase
  .from('submissions')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false });
  
console.log('Submissions:', data, error);

// 3. Check if file exists in storage
const { data: files } = await supabase.storage
  .from('uploads-temp')
  .list(session.user.id);
  
console.log('Files in storage:', files);
```

**Solution:**
- Check that submission record was created
- Verify RLS policy allows user to read own submissions
- Look for errors in browser console

---

#### Issue 4: Upload progress stuck at 0%

**Symptom:** Progress callback never fires or stays at 0%

**Causes:**
1. Progress callback not implemented
2. File size < 6MB (instant upload)
3. Network issue

**Debug Steps:**
```javascript
// Test with progress logging
const result = await window.UploadHandler.handlePaperUpload(
  file,
  metadata,
  (progress) => {
    console.log('Progress:', progress);
  }
);
```

**Note:** Small files (< 6MB) upload instantly, progress jumps to 100%.

---

#### Issue 5: "Supabase not initialized"

**Symptom:** `window.waitForSupabase()` times out

**Causes:**
1. Supabase SDK not loaded
2. ES module initialization failed
3. Network error loading CDN script

**Debug Steps:**
```javascript
// 1. Check if Supabase SDK loaded
console.log('Supabase SDK:', window.supabase);

// 2. Check if client initialized
console.log('Supabase client:', window.__supabase__);

// 3. Check app module
console.log('App ready:', window.App?.isReady);
```

**Solution:**
- Ensure Supabase CDN script loads before app.module.js
- Check network tab for failed script loads
- Verify Supabase config in js/supabase.js

---

### Debugging Tools

#### Enable Verbose Logging

```javascript
// In browser console
localStorage.setItem('DEBUG_UPLOAD', 'true');
location.reload();
```

#### Check Upload State

```javascript
// Current session
console.log('Session:', window.AuthController.getSession());

// Supabase client
console.log('Supabase:', window.__supabase__);

// Upload handler
console.log('UploadHandler:', window.UploadHandler);

// Storage buckets
console.log('Buckets:', window.SupabaseClient.BUCKETS);
```

#### Monitor Upload Events

```javascript
// Log all upload attempts
window.addEventListener('beforeunload', () => {
  console.log('Page unloading, check for pending uploads');
});

// Test upload without UI
const testUpload = async () => {
  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const result = await window.UploadHandler.handlePaperUpload(
    file,
    { paperCode: 'TEST', examYear: 2023 },
    (p) => console.log(p)
  );
  console.log('Test result:', result);
};
```

#### Inspect Submissions Table

```javascript
// Get all submissions (admin)
const supabase = await window.waitForSupabase();
const { data } = await supabase
  .from('submissions')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
  
console.table(data);
```

#### Test Storage Access

```javascript
// Test read access
const { data: files } = await supabase.storage
  .from('uploads-temp')
  .list(session.user.id);
  
console.log('User files:', files);

// Test upload access
const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
const { data, error } = await supabase.storage
  .from('uploads-temp')
  .upload(`${session.user.id}/test.pdf`, testFile);
  
console.log('Test upload:', { data, error });
```

---

## Admin Review Workflow

### Overview

Admins review uploaded papers and move them through the workflow:

```
pending → approved → published
        ↘ rejected
```

### Admin Functions

#### Review Pending Submission

```javascript
// Get pending submissions
const pending = await window.UploadHandler.getPendingSubmissions();

// Review submission
const submission = pending[0];
console.log('Reviewing:', submission.paper_code);

// View file (get signed URL)
const fileUrl = await window.SupabaseClient.getSignedUrl(
  'uploads-temp',
  submission.temp_path,
  3600
);

window.open(fileUrl, '_blank');
```

#### Approve Submission

```javascript
const supabase = await window.waitForSupabase();

// Move file to approved bucket
const approvedPath = `${submission.paper_code}/${submission.exam_year}.pdf`;
await window.SupabaseClient.moveFile(
  'uploads-temp', submission.temp_path,
  'uploads-approved', approvedPath
);

// Update submission
await supabase
  .from('submissions')
  .update({
    status: 'approved',
    approved_path: approvedPath,
    reviewer_id: session.user.id,
    reviewed_at: new Date().toISOString(),
    review_notes: 'Looks good!'
  })
  .eq('id', submission.id);
```

#### Reject Submission

```javascript
// Update submission
await supabase
  .from('submissions')
  .update({
    status: 'rejected',
    reviewer_id: session.user.id,
    reviewed_at: new Date().toISOString(),
    rejection_reason: 'Poor quality scan'
  })
  .eq('id', submission.id);

// Delete temp file
await window.SupabaseClient.deleteFile('uploads-temp', submission.temp_path);
```

#### Publish Submission

```javascript
// Move file to public bucket
const publicPath = `papers/${submission.paper_code}/${submission.exam_year}.pdf`;
await window.SupabaseClient.moveFile(
  'uploads-approved', submission.approved_path,
  'uploads-public', publicPath
);

// Get public URL
const publicUrl = window.SupabaseClient.getPublicUrl(publicPath);

// Update submission
await supabase
  .from('submissions')
  .update({
    status: 'published',
    public_path: publicPath,
    public_url: publicUrl,
    published_at: new Date().toISOString()
  })
  .eq('id', submission.id);
```

### Admin Dashboard Integration

**Location:** `/admin/dashboard/index.html`

**Features:**
- List pending submissions
- Preview PDFs
- Approve/reject with notes
- Publish approved papers
- View submission history

**Required Role:** `admin`

---

## Future Enhancements

**Planned for Future Phases:**

1. **Repeated Questions Upload** (Phase 10)
   - Structured form for question entry
   - Support for multiple questions per submission
   - Tag and categorize questions

2. **Notes/Resources Upload** (Phase 11)
   - Support multiple file types (PDF, DOCX, PPT)
   - Preview generation
   - Categorization system

3. **Batch Upload** (Phase 12)
   - Upload multiple files at once
   - CSV metadata import
   - Progress tracking for batch

4. **OCR Integration** (Phase 13)
   - Automatic text extraction
   - Searchable PDFs
   - Metadata suggestion

5. **Upload Analytics**
   - User contribution stats
   - Popular papers dashboard
   - Quality scoring

---

## Support

**For Issues:**
1. Check [Debugging Guide](#debugging-guide)
2. Review [AUTH_SYSTEM.md](./AUTH_SYSTEM.md) for auth issues
3. Check [REPO_HEALTH_CHECK.md](./REPO_HEALTH_CHECK.md)
4. Check Supabase Dashboard → Storage → Logs
5. Check Supabase Dashboard → Database → Submissions table
6. Open GitHub issue with error logs and steps to reproduce

**Key Files:**
- `js/upload-handler.js` — Core upload logic
- `js/upload.js` — Page controller
- `js/supabase-client.js` — Storage helpers
- `admin/sql/02_submissions_table.sql` — Database schema
- `admin/sql/04_storage_policies.sql` — RLS policies
- `docs/AUTH_SYSTEM.md` — Authentication documentation
- `docs/ARCHITECTURE_MASTER_PLAN.md` — Overall architecture

**Supabase Dashboard:**
- Storage → uploads-temp/approved/public
- Database → submissions table
- Authentication → Users
- Logs → Storage logs, Database logs
