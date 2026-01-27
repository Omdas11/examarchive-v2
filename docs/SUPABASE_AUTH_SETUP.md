# Supabase Authentication Setup Guide

This document explains how to configure Supabase authentication for ExamArchive to work correctly on GitHub Pages.

---

## 🔐 Current Configuration

**Supabase URL**: `https://jigeofftrhhyvnjpptxw.supabase.co`  
**Authentication Method**: Email OTP (Magic Link)  
**Redirect URL**: `https://omdas11.github.io/examarchive-v2/`

---

## ✅ Required Supabase Dashboard Settings

### 1. Authentication → URL Configuration

In your Supabase dashboard, go to **Authentication → URL Configuration** and ensure the following settings:

#### Site URL
```
https://omdas11.github.io/examarchive-v2/
```

#### Redirect URLs (Allowed)
Add these URLs to the allowlist:
```
https://omdas11.github.io/examarchive-v2/
https://omdas11.github.io/examarchive-v2/index.html
https://omdas11.github.io/examarchive-v2/browse.html
```

**Important**: The redirect URL must **exactly match** what's configured in the code. Any mismatch will cause authentication to fail silently.

---

### 2. Email Templates

Go to **Authentication → Email Templates** and customize:

#### Magic Link Template
- **Subject**: Sign in to ExamArchive
- **Content**: Customize with your branding
- **Confirmation URL**: `{{ .ConfirmationURL }}`

The confirmation URL automatically includes the correct redirect URL and auth tokens.

---

## 🔧 Code Configuration

The redirect URL is configured in two places:

### 1. `login.html` (Login Page)
```javascript
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: "https://omdas11.github.io/examarchive-v2/"
  }
});
```

### 2. `js/auth.js` (Profile Panel Login)
```javascript
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: "https://omdas11.github.io/examarchive-v2/"
  }
});
```

**Note**: Both must use the same URL that's configured in Supabase dashboard.

---

## 🔄 How Authentication Works

### Flow Diagram
```
User enters email
    ↓
Supabase sends magic link
    ↓
User clicks link in email
    ↓
Browser redirects to: https://omdas11.github.io/examarchive-v2/#access_token=...&refresh_token=...
    ↓
Supabase JS SDK automatically parses the URL hash
    ↓
Session is created and stored in localStorage
    ↓
onAuthStateChange event fires
    ↓
applyAuthState() updates UI
    ↓
User sees logged-in state instantly
```

### Key Points:
- **No server required**: All auth happens client-side
- **URL fragments**: Auth tokens are passed via `#access_token=...` (not query params)
- **Automatic parsing**: Supabase SDK handles the token extraction
- **Persistent sessions**: Sessions are stored in browser localStorage

---

## 🐛 Troubleshooting

### Issue: "UI doesn't update after clicking magic link"

**Causes**:
1. Redirect URL mismatch between code and Supabase dashboard
2. Auth state initialization runs before DOM partials load
3. Browser blocking localStorage/cookies

**Solutions**:
1. ✅ Verify redirect URLs match exactly (including trailing `/`)
2. ✅ Fixed in code: auth.js now waits for partials to load
3. Check browser console for errors

---

### Issue: "Avatar still shows 'Guest' after login"

**Cause**: Race condition where auth state is checked before session is restored.

**Solution**: ✅ Fixed in `js/auth.js` - now waits for:
- Supabase SDK to load
- Header partial to load
- Profile panel partial to load (if present)

---

### Issue: "Login button unresponsive on mobile"

**Causes**:
1. Touch events not properly handled
2. Button disabled state not managed
3. No visual feedback during loading

**Solutions**: ✅ Fixed in `login.html`:
- Added loading state with disabled button
- Visual feedback with "Sending..." text
- Animated toast notification
- Prevents duplicate submissions

---

## 🧪 Testing Checklist

- [ ] Enter email on login page → receive email
- [ ] Click magic link → redirects to site
- [ ] UI updates to logged-in state (avatar shows initials)
- [ ] Guest elements hidden, user elements visible
- [ ] Profile panel shows user email
- [ ] Logout button works
- [ ] Session persists after page reload
- [ ] Works on mobile browsers
- [ ] Works on desktop browsers

---

## 🔒 Security Notes

1. **Anon key is public**: The `SUPABASE_ANON_KEY` in the code is safe to expose - it's designed for client-side use
2. **Row Level Security**: Ensure RLS policies are enabled in Supabase for all tables
3. **Email verification**: Magic links automatically verify email ownership
4. **Session expiry**: Sessions expire after the configured time in Supabase dashboard

---

## 📝 Future Improvements

- [ ] Add user profile metadata (name, avatar)
- [ ] Implement role-based access control
- [ ] Add social auth providers (Google, GitHub)
- [ ] Show user stats on profile panel
- [ ] Add email verification status indicator
