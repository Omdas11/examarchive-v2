# DEBUG SYSTEM GUIDE

**Phase 9.2 — Comprehensive Guide to the Debug System**

The debug system provides human-readable diagnostic information for administrators and reviewers to troubleshoot issues without reading raw logs or SQL errors.

---

## 🎯 Overview

### What is the Debug System?

The debug system consists of two main components:

1. **Debug Logger** (`js/debug/logger.js`)
   - Structured logging with severity levels
   - Module-based categorization
   - In-memory log storage
   - Access control (admin/reviewer only)

2. **Debug Panel** (`js/debug/panel.js`)
   - Visual interface for viewing logs
   - Real-time updates
   - Filtering capabilities
   - Mobile-friendly design

---

## 🔐 Access Control

### Who Can See Debug Logs?

**Roles with Access**:
- **Admin** (level 3)
- **Reviewer** (level 2)

**Roles Without Access**:
- **User** (level 1)
- **Visitor** (level 0)

### How Access is Determined

```javascript
// Backend verification
const roleInfo = await getUserRoleBackend(session.user.id);
const hasAccess = roleInfo && (roleInfo.name === 'admin' || roleInfo.name === 'reviewer');
```

**Important**: Access is verified on the backend. Frontend-only checks can be bypassed, but the logger only activates for verified admin/reviewer roles.

---

## 🎨 Debug Panel UI

### Enabling the Debug Panel

**For Admins/Reviewers**:

1. Sign in to your account
2. Navigate to **Settings** page
3. Scroll to **Debug Panel (Admin Only)** section
4. Toggle **Enable Debug Panel** to ON
5. Return to any page - the debug panel will appear in the bottom-right corner

### Panel Features

```
┌─────────────────────────────────────────────────┐
│ 🐛 Debug Panel                         [5] 🗑️ ▼ ✕ │
├─────────────────────────────────────────────────┤
│ [All] [Info] [Warnings] [Errors]                │
├─────────────────────────────────────────────────┤
│ [UPLOAD][INFO] 10:32:45                         │
│ Starting paper upload                            │
│                                                 │
│ [AUTH][INFO] 10:32:45                           │
│ Session verified. User authenticated.            │
│                                                 │
│ [STORAGE][INFO] 10:32:46                        │
│ File uploaded successfully to storage            │
└─────────────────────────────────────────────────┘
```

### Panel Controls

| Control | Function |
|---------|----------|
| **🐛 Debug Panel** | Click header to expand/collapse |
| **Badge [5]** | Shows total number of logs |
| **🗑️ (Clear)** | Clear all logs |
| **▼/▲ (Toggle)** | Expand or collapse panel |
| **✕ (Close)** | Hide panel (can re-enable in Settings) |

### Filter Buttons

- **All**: Show all log entries
- **Info**: Show only INFO-level logs
- **Warnings**: Show only WARNING-level logs
- **Errors**: Show only ERROR-level logs

---

## 📊 Log Levels

### INFO (ℹ️)

**Color**: Blue (#2196F3)

**Purpose**: Normal system events and successful operations

**Examples**:
- "Session verified. User authenticated."
- "File uploaded successfully to storage"
- "Upload completed successfully"

**When to use**:
- Tracking workflow progress
- Confirming expected behavior
- Performance monitoring

---

### WARN (⚠️)

**Color**: Orange (#FFA726)

**Purpose**: Recoverable issues that may indicate problems

**Examples**:
- "Auth required - user not logged in"
- "Attempting to clean up uploaded file..."
- "Session check delayed - retrying"

**When to use**:
- User errors (but not critical)
- Recovery attempts
- Deprecated function usage

---

### ERROR (❌)

**Color**: Red (#f44336)

**Purpose**: Failures that require attention

**Examples**:
- "Upload failed: RLS policy violation"
- "JWT token expired or invalid"
- "Database submission record creation failed"

**When to use**:
- Upload failures
- Authentication failures
- Database errors
- Storage errors

---

## 🏷️ Debug Modules

### Module Categories

| Module | Purpose | Used In |
|--------|---------|---------|
| **auth** | Authentication & sessions | Login, logout, session checks |
| **upload** | File upload process | Upload page, submission creation |
| **admin** | Admin operations | Dashboard, review actions |
| **storage** | File storage operations | Upload, approve, delete files |
| **role** | Role management | Role checks, assignments |
| **system** | System-level events | Partial loading, initialization |

### Example Usage

```javascript
import { logInfo, logWarn, logError, DebugModule } from './debug/logger.js';

// AUTH module
logInfo(DebugModule.AUTH, 'User signed in successfully', { userId: user.id });

// UPLOAD module
logError(DebugModule.UPLOAD, 'File validation failed', { reason: 'Invalid type' });

// STORAGE module
logWarn(DebugModule.STORAGE, 'File size approaching limit', { size: '48MB' });
```

---

## 🔍 Reading Debug Messages

### Message Format

Each debug entry contains:

1. **Module** - e.g., [UPLOAD], [AUTH], [STORAGE]
2. **Level** - Displayed with icon (ℹ️, ⚠️, ❌)
3. **Timestamp** - Time the event occurred
4. **Message** - Human-readable explanation
5. **Data** (optional) - Additional context (in console only)

### Example: Upload Flow

```
[UPLOAD][INFO] 10:30:00
Starting paper upload

[UPLOAD][INFO] 10:30:00
Verifying authenticated session...

[AUTH][INFO] 10:30:00
Session verified. User authenticated.

[UPLOAD][INFO] 10:30:01
Uploading file to storage...

[STORAGE][INFO] 10:30:03
File uploaded successfully to storage

[UPLOAD][INFO] 10:30:03
Creating submission record in database...

[UPLOAD][INFO] 10:30:04
Upload completed successfully
```

---

## 🐛 Common Debug Scenarios

### Scenario 1: Upload Permission Error

**Debug Output**:
```
[UPLOAD][INFO] Starting paper upload
[UPLOAD][INFO] Verifying authenticated session...
[AUTH][ERROR] No active session found. Upload blocked.
[UPLOAD][ERROR] Upload failed
```

**Diagnosis**: User not signed in

**Action**: User must sign in before uploading

---

### Scenario 2: RLS Policy Violation

**Debug Output**:
```
[UPLOAD][INFO] Starting paper upload
[AUTH][INFO] Session verified. User authenticated.
[UPLOAD][INFO] Uploading file to storage...
[STORAGE][ERROR] RLS policy violation - user may not be authenticated or lacks permission
[UPLOAD][ERROR] Upload failed
```

**Diagnosis**: Storage RLS rejecting upload despite session

**Action**:
1. Check if session is truly valid (`await supabase.auth.getSession()`)
2. Verify storage policies in Supabase dashboard
3. Ensure ONE Supabase client is used across app

---

### Scenario 3: Network Interruption

**Debug Output**:
```
[UPLOAD][INFO] Starting paper upload
[AUTH][INFO] Session verified. User authenticated.
[UPLOAD][INFO] Uploading file to storage...
[STORAGE][ERROR] Network error - upload interrupted
[UPLOAD][ERROR] Upload failed
```

**Diagnosis**: Internet connection lost during upload

**Action**: User should check connection and retry

---

### Scenario 4: JWT Expiration

**Debug Output**:
```
[UPLOAD][INFO] Starting paper upload
[UPLOAD][INFO] Verifying authenticated session...
[AUTH][ERROR] JWT token expired or invalid
[UPLOAD][ERROR] Upload failed
```

**Diagnosis**: Session token expired

**Action**: User must sign in again

---

## 🛠️ Admin Troubleshooting

### Using Debug Panel for Troubleshooting

#### Step 1: Enable Debug Panel

Settings → Debug Panel (Admin Only) → Enable Debug Panel: ON

#### Step 2: Reproduce the Issue

1. Navigate to the page where the issue occurs
2. Perform the action that triggers the error
3. Observe debug panel for log entries

#### Step 3: Filter Logs

- Click **Errors** to see only error-level logs
- Click **Warnings** to see potential issues
- Click **All** to see complete flow

#### Step 4: Identify Root Cause

Look for the **first ERROR** in the sequence - this is usually the root cause.

**Example**:
```
[AUTH][INFO] Session verified ← OK
[UPLOAD][INFO] Starting upload ← OK
[STORAGE][ERROR] RLS policy violation ← ROOT CAUSE
[UPLOAD][ERROR] Upload failed ← CONSEQUENCE
```

#### Step 5: Apply Fix

Based on the error message:

| Error Message | Likely Fix |
|---------------|-----------|
| "No active session" | User must sign in |
| "JWT token expired" | User must sign in again |
| "RLS policy violation" | Check storage/database policies |
| "Permission denied" | Verify user role |
| "File too large" | User must compress file |
| "Network error" | Check internet connection |

---

## 🎓 For Developers

### Adding Debug Logs to Your Code

#### Step 1: Import Debug Functions

```javascript
import { logInfo, logWarn, logError, DebugModule } from './debug/logger.js';
```

#### Step 2: Add Logs at Key Points

```javascript
export async function myFunction() {
  logInfo(DebugModule.SYSTEM, 'myFunction called');
  
  try {
    // Do something
    const result = await someOperation();
    logInfo(DebugModule.SYSTEM, 'Operation completed', { result });
    
    return result;
  } catch (error) {
    logError(DebugModule.SYSTEM, 'Operation failed', { error: error.message });
    throw error;
  }
}
```

#### Step 3: Choose Appropriate Level

- **INFO**: Expected behavior, progress updates
- **WARN**: Unexpected but recoverable situations
- **ERROR**: Failures that prevent operation completion

#### Step 4: Choose Appropriate Module

Use the module that best describes where the code runs:

- **DebugModule.AUTH** - Authentication/authorization
- **DebugModule.UPLOAD** - File upload workflows
- **DebugModule.STORAGE** - Storage operations
- **DebugModule.ADMIN** - Admin-specific features
- **DebugModule.ROLE** - Role management
- **DebugModule.SYSTEM** - General system operations

---

## 📱 Mobile Debug Panel

### Mobile-Friendly Features

1. **Responsive Design**: Panel adapts to screen width
2. **Touch-Friendly**: Large buttons for easy tapping
3. **Collapsible**: Minimize to save screen space
4. **Bottom Placement**: Doesn't cover important content

### Using on Mobile

1. Enable debug panel in Settings (use desktop if easier)
2. Return to app
3. Panel appears at bottom of screen
4. Tap header to expand/collapse
5. Swipe up/down in log area to scroll

---

## ⚙️ Debug Panel Settings

### Settings Location

**Settings → Debug Panel (Admin Only)**

### Available Controls

#### 1. Enable Debug Panel

**Type**: Toggle  
**Effect**: Shows/hides the debug panel

When enabled:
- Debug panel appears on all pages
- Logs are collected and displayed
- Panel state persists across page loads

When disabled:
- Debug panel hidden
- Logs still collected (in memory only)
- Can be re-enabled anytime

#### 2. Clear Debug Logs

**Type**: Button  
**Effect**: Removes all log entries

Use when:
- Debug panel cluttered with old logs
- Starting fresh troubleshooting session
- Logs contain sensitive test data

**Note**: Logs are only stored in memory. Clearing them is permanent (no undo).

#### 3. Reset Upload Demo Data

**Type**: Button  
**Effect**: Deletes ALL submissions from database

**⚠️ WARNING**: This is destructive and cannot be undone!

Use for:
- Resetting demo environment
- Clearing test data
- Starting fresh after testing

**Requires**: Admin role + RLS permissions

---

## 🔒 Security Considerations

### What Debug Panel Shows

**Visible in Panel**:
- Operation types (upload, auth, etc.)
- Success/failure status
- General error messages
- Timestamps

**NOT Visible in Panel**:
- User passwords
- JWT tokens (full)
- API keys
- Sensitive user data

### Console Logs

Debug messages are also logged to browser console with additional data:

```javascript
console.log(
  '%c[UPLOAD][INFO] 10:30:00',
  'color: #2196F3; font-weight: bold;',
  'Starting paper upload',
  { filename: 'physics-2023.pdf' } // Additional context
);
```

**Access**: Anyone can view console logs, but debug system limits access to admin/reviewer roles for the UI panel.

---

## 💡 Best Practices

### For Admins Using Debug Panel

1. **Enable only when needed**: Keep panel disabled during normal use
2. **Clear logs periodically**: Don't let logs accumulate unnecessarily
3. **Screenshot errors**: Capture error messages for reporting
4. **Check console too**: More detail available in browser console
5. **Document findings**: Keep notes on recurring issues

### For Developers Adding Logs

1. **Log sparingly**: Only log important events
2. **Use appropriate levels**: Don't overuse ERROR
3. **Write clear messages**: "Upload started" > "fn called"
4. **Include context**: Add helpful data in third parameter
5. **Don't log sensitive data**: Never log passwords, tokens, etc.

---

## 🧪 Testing Debug System

### Verify Debug Panel Works

1. Sign in as admin
2. Enable debug panel in Settings
3. Navigate to Upload page
4. Check panel appears
5. Perform an upload (success or failure)
6. Verify logs appear in panel

### Test Access Control

1. Sign in as regular user
2. Check Settings page - debug section should NOT appear
3. Open console, try to import debug panel:
   ```javascript
   import('./js/debug/panel.js').then(m => m.showDebugPanel());
   ```
4. Panel should not show (access denied)

---

## 📊 Debug Log Persistence

### Current Behavior

- **Storage**: In-memory only (no database, no localStorage)
- **Capacity**: Last 100 log entries
- **Lifetime**: Until page reload or manual clear
- **Access**: Current session only

### Future Enhancements

Potential improvements:
- Optional localStorage persistence (user setting)
- Export logs as JSON/CSV
- Server-side log aggregation (for analytics)
- Log search/filtering by module

---

## 🎯 Quick Reference

### Common Commands

```javascript
// Import
import { logInfo, logWarn, logError, DebugModule } from './debug/logger.js';

// Log at different levels
logInfo(DebugModule.UPLOAD, 'Upload started');
logWarn(DebugModule.AUTH, 'Session check delayed');
logError(DebugModule.STORAGE, 'Upload failed');

// With additional data
logInfo(DebugModule.UPLOAD, 'File uploaded', { filename: 'test.pdf', size: '5MB' });

// Check if debug enabled
if (debugLogger.isEnabled()) {
  // Debug-specific code
}

// Clear logs programmatically
debugLogger.clear();
```

---

## 📚 Related Documentation

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [FILE_MAP.md](./FILE_MAP.md) - File reference
- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md) - Upload process
- [ROLE_SYSTEM.md](./ROLE_SYSTEM.md) - Role management

---

**Last Updated**: Phase 9.2  
**Debug System Version**: v1.0
