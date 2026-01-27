# Testing Checklist for Supabase Auth Fix

This document provides a comprehensive testing checklist to verify that the Supabase email OTP authentication fix works correctly.

---

## 🎯 Prerequisites

Before testing, ensure:

1. **Supabase Dashboard Configuration**:
   - [ ] Site URL is set to: `https://omdas11.github.io/examarchive-v2/`
   - [ ] Redirect URLs include:
     - `https://omdas11.github.io/examarchive-v2/`
     - `https://omdas11.github.io/examarchive-v2/index.html`
     - `https://omdas11.github.io/examarchive-v2/browse.html`
   - [ ] Email provider is configured (default or custom SMTP)
   - [ ] Email templates are set up

2. **Browser Setup**:
   - [ ] Test in Chrome/Edge (desktop)
   - [ ] Test in Safari (desktop)
   - [ ] Test in Chrome (mobile/Android)
   - [ ] Test in Safari (mobile/iOS)
   - [ ] Clear browser cache and localStorage before testing
   - [ ] Allow cookies and localStorage

---

## 🔐 Test Case 1: Guest State on First Visit

**Expected Behavior**: When a user visits the site for the first time (not logged in), they should see the guest UI.

### Steps:
1. [ ] Open browser in incognito/private mode
2. [ ] Navigate to `https://omdas11.github.io/examarchive-v2/`
3. [ ] Wait for page to fully load (2-3 seconds)

### Verify:
- [ ] Avatar in header shows "OM" or default initials
- [ ] "Login" link is visible in navigation
- [ ] Clicking avatar redirects to login page (NOT shows popup)
- [ ] No console errors in browser DevTools
- [ ] `document.body.classList` does NOT contain "logged-in"

---

## 🔐 Test Case 2: Login Flow - Desktop

**Expected Behavior**: User can log in using email OTP on desktop.

### Steps:
1. [ ] Navigate to `https://omdas11.github.io/examarchive-v2/login.html`
2. [ ] Enter a valid email address
3. [ ] Click "Continue" button

### Verify:
- [ ] Button shows "Sending..." immediately
- [ ] Button and input are disabled during request
- [ ] Success message appears: "✉️ Check your email for the login link!"
- [ ] Toast notification appears at bottom of screen
- [ ] No console errors

### Steps (continued):
4. [ ] Check email inbox for magic link
5. [ ] Click the magic link

### Verify:
- [ ] Browser redirects to `https://omdas11.github.io/examarchive-v2/#access_token=...`
- [ ] URL hash contains: `access_token`, `expires_in`, `refresh_token`
- [ ] Page loads and hash is processed automatically
- [ ] **UI updates to logged-in state** (critical!)
- [ ] Avatar now shows user's email initials (e.g., "TE" for test@example.com)
- [ ] "Login" link is hidden in navigation
- [ ] `document.body.classList` contains "logged-in"
- [ ] No console errors

---

## 🔐 Test Case 3: Login Flow - Mobile

**Expected Behavior**: Same as Test Case 2, but on mobile device.

### Steps:
1. [ ] Open mobile browser (Chrome on Android or Safari on iOS)
2. [ ] Navigate to `https://omdas11.github.io/examarchive-v2/login.html`
3. [ ] Enter email and tap "Continue"

### Verify:
- [ ] Button is responsive to touch
- [ ] Toast notification is visible and properly positioned
- [ ] Loading state is clear
- [ ] Success message is readable

### Steps (continued):
4. [ ] Open email app on same mobile device
5. [ ] Tap magic link

### Verify:
- [ ] Mobile browser opens automatically
- [ ] Redirect works correctly (may switch to browser app)
- [ ] UI updates to logged-in state
- [ ] Touch interactions work for avatar

---

## 🔐 Test Case 4: Session Persistence

**Expected Behavior**: User remains logged in after page reload.

### Prerequisites:
- [ ] Complete Test Case 2 or 3 first (user must be logged in)

### Steps:
1. [ ] With user logged in, navigate to different pages:
   - [ ] `index.html`
   - [ ] `browse.html`
   - [ ] `about.html`
   - [ ] `settings.html`

### Verify (on each page):
- [ ] Avatar shows user initials (NOT default "OM")
- [ ] `document.body.classList` contains "logged-in"
- [ ] "Login" link is hidden

### Steps (continued):
2. [ ] Refresh the page (F5 or Cmd+R)

### Verify:
- [ ] User remains logged in (avatar still shows initials)
- [ ] Session is restored within 2 seconds
- [ ] No flickering between guest/logged-in states

### Steps (continued):
3. [ ] Close browser tab
4. [ ] Reopen browser
5. [ ] Navigate to site again

### Verify:
- [ ] User is still logged in
- [ ] Session persisted in localStorage

---

## 🔐 Test Case 5: Avatar Behavior - Guest

**Expected Behavior**: Clicking avatar as guest redirects to login page.

### Prerequisites:
- [ ] User is NOT logged in (clear session or use incognito)

### Steps:
1. [ ] Navigate to any page (e.g., `index.html`)
2. [ ] Click avatar button in header

### Verify:
- [ ] Browser redirects to `login.html`
- [ ] NO popup appears
- [ ] No JavaScript errors

---

## 🔐 Test Case 6: Avatar Behavior - Logged In

**Expected Behavior**: Clicking avatar as logged-in user shows popup.

### Prerequisites:
- [ ] User is logged in (complete Test Case 2 first)

### Steps:
1. [ ] Navigate to any page (e.g., `index.html`)
2. [ ] Click avatar button in header

### Verify:
- [ ] Avatar popup appears (drops down from header)
- [ ] Popup shows user's email
- [ ] "View profile" button is visible
- [ ] "Manage Account" button is visible
- [ ] "Sign in" button is hidden
- [ ] No redirect occurs

### Steps (continued):
3. [ ] Click "View profile" button

### Verify:
- [ ] Profile panel slides in from right
- [ ] Shows user details and stats
- [ ] "Log out" button is visible

---

## 🔐 Test Case 7: Profile Panel Login (Alternative Method)

**Expected Behavior**: User can log in from profile panel.

### Prerequisites:
- [ ] User is NOT logged in

### Steps:
1. [ ] Navigate to any page with profile panel (e.g., `index.html`)
2. [ ] Click avatar → should redirect to login.html (per Test Case 5)
3. [ ] Go back to home page
4. [ ] Open browser console and force profile panel open:
   ```javascript
   document.getElementById('profile-panel').classList.add('open');
   ```

### Verify:
- [ ] Profile panel shows guest state
- [ ] Email input is visible
- [ ] "Continue" button is visible

### Steps (continued):
5. [ ] Enter email in profile panel
6. [ ] Click "Continue"

### Verify:
- [ ] Message appears: "Check your email ✉️ (open link in the same browser)"
- [ ] Email is sent
- [ ] Magic link works (same as Test Case 2)

---

## 🔐 Test Case 8: Logout

**Expected Behavior**: User can log out and UI updates correctly.

### Prerequisites:
- [ ] User is logged in

### Steps:
1. [ ] Navigate to any page
2. [ ] Click avatar to open popup
3. [ ] Click "View profile"
4. [ ] Click "Log out" button

### Verify:
- [ ] Page reloads
- [ ] User is logged out
- [ ] Avatar shows default initials
- [ ] "Login" link reappears in navigation
- [ ] `document.body.classList` does NOT contain "logged-in"
- [ ] Profile panel shows guest state

---

## 🔐 Test Case 9: Error Handling

**Expected Behavior**: Errors are handled gracefully.

### Test 9a: Invalid Email
1. [ ] Go to login page
2. [ ] Enter invalid email: "notanemail"
3. [ ] Click "Continue"

**Verify**:
- [ ] Browser validation prevents submission OR
- [ ] Supabase returns error message
- [ ] Error is displayed in red

### Test 9b: Network Error
1. [ ] Open DevTools → Network tab
2. [ ] Set network to "Offline"
3. [ ] Try to log in

**Verify**:
- [ ] Error message: "Network error. Please try again."
- [ ] Button is re-enabled
- [ ] User can retry

### Test 9c: Rate Limiting
1. [ ] Submit login form 5+ times rapidly
2. [ ] Wait for rate limit response

**Verify**:
- [ ] Error message from Supabase is displayed
- [ ] No crash or hang
- [ ] User can wait and retry

---

## 🔐 Test Case 10: Multiple Tabs

**Expected Behavior**: Auth state syncs across tabs.

### Steps:
1. [ ] Log in on Tab 1 (complete Test Case 2)
2. [ ] Open Tab 2 with same site
3. [ ] Check if Tab 2 shows logged-in state

### Verify:
- [ ] Tab 2 automatically shows logged-in state
- [ ] No manual refresh needed (auth state syncs via localStorage events)

### Steps (continued):
4. [ ] Log out on Tab 1
5. [ ] Switch to Tab 2

### Verify:
- [ ] Tab 2 updates to guest state (may require refresh depending on implementation)

---

## 🔐 Test Case 11: Edge Cases

### Test 11a: Page Without Profile Panel (e.g., login.html)
1. [ ] Navigate to `login.html` while logged in
2. [ ] Wait for page load

**Verify**:
- [ ] Auth state is restored within 2 seconds
- [ ] No 2-second delay (smart detection works)
- [ ] Console logs show header loaded but NOT waiting for profile panel

### Test 11b: Expired Session
1. [ ] Log in
2. [ ] Wait for session to expire (default: 1 hour)
3. [ ] Try to access protected functionality

**Verify**:
- [ ] Session expires gracefully
- [ ] User is logged out automatically
- [ ] UI updates to guest state

### Test 11c: Direct Link with Auth Hash
1. [ ] Copy magic link URL (with `#access_token=...`)
2. [ ] Paste in new incognito window

**Verify**:
- [ ] User is logged in
- [ ] Hash is processed
- [ ] Redirect works

---

## 📊 Performance Checks

### Metrics to Verify:
- [ ] Auth initialization completes within 2 seconds
- [ ] No visible UI flickering during page load
- [ ] No duplicate network requests for session check
- [ ] localStorage has `supabase.auth.token` key after login

### Browser Console Checks:
- [ ] No errors or warnings in console
- [ ] `authInitialized` flag prevents duplicate initialization
- [ ] Toast timer is properly cleared (no memory leaks)

---

## ✅ Final Checklist

- [ ] All test cases pass on desktop Chrome
- [ ] All test cases pass on desktop Safari
- [ ] All test cases pass on mobile Chrome (Android)
- [ ] All test cases pass on mobile Safari (iOS)
- [ ] No console errors or warnings
- [ ] Performance is acceptable (< 2s auth init)
- [ ] Documentation is accurate and complete
- [ ] Code review feedback is addressed
- [ ] Security scan (CodeQL) shows no vulnerabilities

---

## 🐛 Known Issues / Limitations

Document any issues found during testing:

1. **Issue**: [description]
   - **Severity**: High / Medium / Low
   - **Workaround**: [if any]
   - **Fix planned**: Yes / No

---

## 📝 Test Results Log

| Date | Tester | Browser | Pass/Fail | Notes |
|------|--------|---------|-----------|-------|
| YYYY-MM-DD | [Name] | Chrome 120 | Pass | All test cases passed |
| | | | | |

---

## 🔗 Related Documentation

- [Supabase Auth Setup Guide](./SUPABASE_AUTH_SETUP.md)
- [Supabase Documentation](https://supabase.com/docs/guides/auth)
- [GitHub Pages Configuration](https://docs.github.com/en/pages)
