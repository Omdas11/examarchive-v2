# Phase 8.2 Testing Guide

## Overview
This guide helps verify that the admin role UI synchronization fixes are working correctly.

---

## Prerequisites
- Live deployment with Supabase authentication configured
- Test accounts for different roles:
  - Admin user account
  - Regular user account
  - Guest (no account)

---

## Test Cases

### Test 1: Admin User Badge Display
**Objective**: Verify admin users see the Admin badge

**Steps**:
1. Sign in with an admin account
2. Click on the avatar/profile icon to open the profile panel
3. Observe the badge displayed

**Expected Result**:
- ✅ Badge shows "Admin" with crown icon (👑)
- ✅ Badge color is red (#f44336)
- ✅ No flicker or temporary "Contributor" badge

**Console Logs to Verify**:
```
[ROLE] resolved: admin
[BADGE] resolved: Admin
[BADGE] rendered: Admin (profile-panel)
[PROFILE-PANEL] User is admin: true
[ADMIN] dashboard access granted
```

---

### Test 2: Admin Dashboard Link Visibility
**Objective**: Verify admin users see the Admin Dashboard link

**Steps**:
1. Sign in with an admin account
2. Open the profile panel
3. Look for the "Admin Dashboard" button

**Expected Result**:
- ✅ "Admin Dashboard" button is visible
- ✅ Button is styled with red theme (btn btn-red)
- ✅ Button appears immediately (no delay)

**Console Logs to Verify**:
```
[PROFILE-PANEL] User is admin: true
[ADMIN] dashboard access granted
```

---

### Test 3: Admin Dashboard Access
**Objective**: Verify admin users can access the admin dashboard

**Steps**:
1. Sign in with an admin account
2. Navigate directly to `/admin/dashboard.html`
3. Observe the page content

**Expected Result**:
- ✅ Dashboard loads successfully
- ✅ No "Access Denied" message
- ✅ Dashboard content is visible
- ✅ No prolonged loading screen

**Console Logs to Verify**:
```
[ADMIN-DASHBOARD] DOMContentLoaded - Checking admin access...
[ADMIN-DASHBOARD] Waiting for role:ready event...
[ADMIN-DASHBOARD] Role state received: {status: 'admin', badge: 'Admin', ready: true}
[ROLE] resolved: admin
[ADMIN-DASHBOARD] Admin access check: GRANTED
[ADMIN] dashboard access granted
```

---

### Test 4: Regular User Badge Display
**Objective**: Verify regular users see the Contributor badge

**Steps**:
1. Sign in with a regular (non-admin) user account
2. Click on the avatar/profile icon to open the profile panel
3. Observe the badge displayed

**Expected Result**:
- ✅ Badge shows "Contributor" with document icon (📝)
- ✅ Badge color is green (#4CAF50)
- ✅ No admin-specific UI elements visible

**Console Logs to Verify**:
```
[ROLE] resolved: user
[BADGE] resolved: Contributor
[BADGE] rendered: Contributor (profile-panel)
[PROFILE-PANEL] User is admin: false
```

---

### Test 5: Regular User Dashboard Access Denied
**Objective**: Verify regular users cannot access admin dashboard

**Steps**:
1. Sign in with a regular (non-admin) user account
2. Navigate directly to `/admin/dashboard.html`
3. Observe the page content

**Expected Result**:
- ✅ "Access Denied" message is displayed
- ✅ Dashboard content is NOT visible
- ✅ "Go Home" button is available

**Console Logs to Verify**:
```
[ADMIN-DASHBOARD] Admin access check: DENIED
🔒 Admin dashboard access denied - user role is: user
```

---

### Test 6: Guest User Badge Display
**Objective**: Verify guests see the Guest badge

**Steps**:
1. Visit the site without signing in (or sign out if logged in)
2. Click on the avatar/profile icon to open the profile panel
3. Observe the badge displayed

**Expected Result**:
- ✅ Badge shows "Guest" with person icon (👤)
- ✅ Badge color is gray (#9E9E9E)
- ✅ "Sign in with Google" button is displayed

**Console Logs to Verify**:
```
[ROLE] resolved: guest
[BADGE] rendered: Guest (profile-panel)
```

---

### Test 7: Guest Dashboard Access Denied
**Objective**: Verify guests cannot access admin dashboard

**Steps**:
1. Ensure you are not signed in
2. Navigate directly to `/admin/dashboard.html`
3. Observe the page content

**Expected Result**:
- ✅ "Access Denied" message is displayed
- ✅ Dashboard content is NOT visible

**Console Logs to Verify**:
```
[ADMIN-DASHBOARD] Admin access check: DENIED
🔒 Admin dashboard access denied - user role is: guest
```

---

### Test 8: Role Change Reactivity
**Objective**: Verify UI updates when switching accounts

**Steps**:
1. Sign in with a regular user account
2. Verify "Contributor" badge is shown
3. Click "Switch Account" button
4. Sign in with an admin account
5. Open profile panel again

**Expected Result**:
- ✅ First sign-in shows "Contributor" badge
- ✅ After switch, shows "Admin" badge
- ✅ Admin Dashboard link appears after admin login
- ✅ No stale state or caching issues

**Console Logs to Verify**:
```
🔔 AUTH EVENT: SIGNED_OUT
[ROLE] Cache cleared
[ROLE] Global state updated after SIGNED_OUT

🔔 AUTH EVENT: SIGNED_IN
[ROLE] Cache cleared
[ROLE] Global state updated after SIGNED_IN
[ROLE] resolved: admin
```

---

### Test 9: Page Refresh Persistence
**Objective**: Verify role state persists after page refresh

**Steps**:
1. Sign in with an admin account
2. Verify admin UI is visible
3. Refresh the page (F5 or Cmd+R)
4. Wait for page to load
5. Open profile panel

**Expected Result**:
- ✅ Admin badge still shows "Admin"
- ✅ Admin Dashboard link is still visible
- ✅ No temporary "Guest" or "Contributor" badge

**Console Logs to Verify**:
```
[ROLE] Initializing global role state...
[ROLE] Session found, fetching profile for user: <uuid>
[ROLE] resolved: admin
[ROLE] role:ready event dispatched
```

---

### Test 10: No Badge Flickering
**Objective**: Verify no visual flickering during role resolution

**Steps**:
1. Clear browser cache
2. Sign in with an admin account
3. Watch the profile panel carefully during page load
4. Open profile panel immediately after page load

**Expected Result**:
- ✅ NO temporary "Contributor" or "Guest" badge shown
- ✅ Badge appears only once with correct value
- ✅ No visual flickering or badge changes

**Visual Behavior**:
- Before role:ready: No badge rendered (or loading indicator)
- After role:ready: Correct badge appears immediately

---

## Debugging Failed Tests

### If Admin Badge Shows "Contributor"
1. Check browser console for `[ROLE]` and `[BADGE]` logs
2. Verify `window.__APP_ROLE__` in console: `console.log(window.__APP_ROLE__)`
3. Check Supabase profile: Run SQL query `SELECT * FROM profiles WHERE email = 'admin@example.com'`
4. Ensure `role` column is set to `'admin'`
5. Clear browser cache and try again

### If Admin Dashboard Link Not Visible
1. Open browser console
2. Look for `[PROFILE-PANEL] User is admin:` log
3. If it shows `false`, check global role state: `console.log(window.__APP_ROLE__)`
4. Verify role:ready event fired: Look for `[ROLE] role:ready event dispatched`
5. Check if profile panel rendered before role was ready

### If Access Denied Shown for Admin
1. Check console for admin dashboard logs
2. Look for `[ADMIN-DASHBOARD] Admin access check: DENIED`
3. Check what role was detected: `[ADMIN-DASHBOARD] Role state received:`
4. If role is not 'admin', verify database has correct role
5. Clear role cache by signing out and signing in again

### If Badge Flickers
1. Check if profile panel is rendering before role:ready
2. Look for premature render logs
3. Verify `initializeGlobalRoleState()` completes before UI render
4. Check network tab for slow profile fetch

---

## Success Criteria Checklist

Use this checklist to verify all fixes are working:

- [ ] ✅ Admin users see "Admin" badge (not "Contributor")
- [ ] ✅ Admin Dashboard link appears for admin users
- [ ] ✅ Admin users can access `/admin/dashboard.html`
- [ ] ✅ Regular users see "Contributor" badge
- [ ] ✅ Regular users cannot access admin dashboard
- [ ] ✅ Guest users see "Guest" badge
- [ ] ✅ Guest users cannot access admin dashboard
- [ ] ✅ No badge flickering on page load
- [ ] ✅ Role state persists after page refresh
- [ ] ✅ Role updates correctly when switching accounts

---

## Known Limitations

1. **First-Time Sign In**: Very first sign-in may require page refresh if profile creation is slow
2. **Profile Creation Delay**: If database trigger is slow, there may be a brief delay
3. **Browser Cache**: Old sessions may need cache clear to update role

---

## Reporting Issues

If tests fail, report with:
1. **Browser**: Chrome/Firefox/Safari version
2. **User Role**: Admin/User/Guest
3. **Console Logs**: Copy all `[ROLE]`, `[BADGE]`, `[ADMIN]` logs
4. **Steps to Reproduce**: Detailed steps that cause the issue
5. **Expected vs Actual**: What should happen vs what actually happened

---

**Phase 8.2 Testing Status**: Ready for validation  
**Next Step**: Run all test cases and verify acceptance criteria
