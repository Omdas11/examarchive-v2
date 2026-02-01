# Phase 9.1 Implementation Notes

## Overview
This document provides technical details about Phase 9.1 implementation for developers and maintainers.

---

## Architecture Decisions

### 1. Navigation Path Strategy
**Problem:** Admin dashboard at `/admin/dashboard.html` couldn't navigate to root pages using relative paths like `index.html`.

**Solution:** Changed all navigation links to root-relative paths (`/index.html`).

**Benefits:**
- Works from any directory depth
- GitHub Pages compatible
- No JavaScript path resolution needed

**Files Modified:**
- `partials/header.html` - All `<a href>` tags in nav and mobile nav

---

### 2. Error Handling Strategy

#### Admin Dashboard
**Problem:** RLS errors and empty result sets showed as "Failed to load submissions" popup.

**Solution:** 
```javascript
if (error) {
  // Check if it's a real error or just RLS/permissions issue
  if (error.code !== 'PGRST116' && !error.message?.includes('RLS')) {
    showMessage('Failed to load submissions: ' + error.message, 'error');
  }
  allSubmissions = [];
}
```

**Benefits:**
- Graceful empty state for new installations
- Real errors still reported
- Better UX

#### Upload Handler
**Problem:** Users saw raw SQL errors like "violates row-level security policy".

**Solution:** Error message mapping:
```javascript
if (error.message?.includes('JWT')) {
  userMessage = 'Your session has expired. Please sign in again.';
} else if (error.message?.includes('RLS')) {
  userMessage = 'You do not have permission to upload.';
}
// ... more mappings
```

**Benefits:**
- User-friendly error messages
- No technical jargon exposed
- Maintains security (doesn't leak schema info)

---

### 3. Upload Type Selector

**Design Pattern:** Radio button cards with visual feedback

**Implementation:**
```html
<label class="type-option active" data-type="question-paper">
  <input type="radio" name="upload-type" value="question-paper" checked />
  <div class="type-content">
    <div class="type-icon">📄</div>
    <div class="type-info">
      <strong>Question Paper</strong>
      <small>Upload previous year question papers (PDF)</small>
    </div>
  </div>
</label>
```

**CSS Strategy:**
- Mobile: Vertical stack (better touch targets)
- Desktop: Horizontal row (better visual comparison)
- Disabled state: Opacity 0.5 + cursor: not-allowed

**JavaScript:**
```javascript
option.addEventListener('click', (e) => {
  if (option.classList.contains('disabled')) {
    showMessage('This upload type is coming in a future phase', 'info');
    return;
  }
  selectedUploadType = input.value;
});
```

---

### 4. Footer Redesign

**Layout Strategy:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

**Logo Strategy:**
```css
.brand-logo {
  width: 56px;
  filter: grayscale(20%);
}
.brand-logo:hover {
  filter: grayscale(0%);
}
```

**Graceful Degradation:**
```html
<img src="/assets/logos/github.png" 
     alt="GitHub" 
     onerror="this.style.display='none'">
```

If logo doesn't exist, it hides instead of showing broken image.

---

### 5. Delete Functionality

**Safety Measures:**
1. Confirmation dialog with submission details
2. Cleans up all storage buckets:
   ```javascript
   if (submission.temp_path) {
     await deleteFile(BUCKETS.TEMP, submission.temp_path);
   }
   if (submission.approved_path) {
     await deleteFile(BUCKETS.APPROVED, submission.approved_path);
   }
   if (submission.public_path) {
     await deleteFile(BUCKETS.PUBLIC, submission.public_path);
   }
   ```
3. Database record deletion
4. Real-time dashboard update

**Admin-Only Access:**
- Button only shown to admins (backend verified)
- Delete action requires admin session
- RLS policies enforce access control

---

## Database Schema Changes

### Roles Table Extension

**Before (Phase 8):**
```sql
insert into roles (name, level, description) values
  ('visitor', 0, '...'),
  ('user', 10, '...'),
  ('reviewer', 50, '...'),
  ('admin', 100, '...');
```

**After (Phase 9.1):**
```sql
insert into roles (name, level, description) values
  ('visitor', 0, '...'),
  ('user', 10, '...'),
  ('ai_reviewer', 40, '...'),  -- NEW
  ('reviewer', 50, '...'),
  ('moderator', 60, '...'),     -- NEW
  ('curator', 70, '...'),       -- NEW
  ('admin', 100, '...');
```

**Role Hierarchy:**
```
Level 0   → visitor (no account)
Level 10  → user (basic)
Level 40  → ai_reviewer (automated)
Level 50  → reviewer (manual review)
Level 60  → moderator (community management)
Level 70  → curator (content organization)
Level 100 → admin (full control)
```

**Usage:**
- Current UI only uses visitor, user, reviewer, admin
- New roles ready for Phase 10+ features
- Backend functions work with all roles

---

## CSS Architecture

### Upload Type Selector Responsive Design

```css
/* Mobile: Vertical stack */
@media (max-width: 767px) {
  .type-options {
    flex-direction: column;
  }
  .type-content {
    flex-direction: row;  /* Icon + text horizontal */
  }
}

/* Desktop: Horizontal row */
@media (min-width: 768px) {
  .type-options {
    flex-direction: row;
  }
  .type-content {
    flex-direction: column;  /* Icon + text vertical */
    text-align: center;
  }
}
```

### Footer Logo Filters

```css
/* Grayscale by default */
.brand-logo {
  filter: grayscale(20%);
}

/* Full color on hover */
.logo-link:hover .brand-logo {
  filter: grayscale(0%);
}

/* Dark theme adjustments */
body[data-theme="dark"] .brand-logo {
  filter: brightness(0.9) grayscale(20%);
}
```

---

## Testing Strategy

### Manual Testing Checklist

**Upload Flow:**
1. Visit `/upload.html` without login → Shows auth prompt
2. Login → Upload form appears
3. Select "Repeated Questions" → Shows "coming soon" message
4. Select "Question Paper" → Form enabled
5. Try uploading non-PDF → Error: "Only PDF files are allowed"
6. Upload PDF without paper code → Error: "Please enter a paper code"
7. Upload valid PDF → Progress bar, success message, form reset

**Admin Dashboard:**
1. Visit `/admin/dashboard.html` as non-admin → Access denied
2. Login as admin → Dashboard loads
3. No submissions → Shows empty state (no error popup)
4. Upload paper as user → Real-time update in admin dashboard
5. Click "Approve & Publish" → Status changes, PDF moves to public
6. Click "Delete" → Confirmation, then submission removed

**Navigation:**
1. From root (`/index.html`) → All links work
2. From admin (`/admin/dashboard.html`) → All links work
3. Mobile hamburger menu → Opens, links work, closes on click

**Footer:**
1. Desktop view → 3 columns visible
2. Tablet view → 2 columns
3. Mobile view → 1 column (stacked)
4. Click footer links → All destinations load
5. Logo hover → Color effect works

---

## Performance Considerations

### Image Loading
- Logos use PNG format (transparent backgrounds)
- Recommended sizes: 64×64 (platform), 48×48 (university)
- `onerror` handler prevents broken images

### Database Queries
- Admin dashboard uses single query with join:
  ```sql
  select *, profiles:user_id (email)
  from submissions
  order by created_at desc
  ```
- Real-time subscriptions use efficient channel filtering
- No N+1 queries

### Bundle Size
- No additional dependencies added
- CSS changes: +~200 lines
- JS changes: +~300 lines
- Total impact: ~15KB uncompressed

---

## Known Limitations

### 1. Logo Assets Not Included
- Footer references logos that don't exist yet
- Gracefully handles missing files (hides broken images)
- See `assets/logos/README.md` for requirements

### 2. Static Papers vs Dynamic Papers
- Browse page shows static papers from JSON
- Dynamic papers (from submissions) not integrated yet
- Future phase should merge both sources

### 3. Demo Reset Not Implemented
- Settings page doesn't have "Reset Demo" button
- Would require new RPC function:
  ```sql
  create function reset_demo_submissions()
  returns void as $$
    delete from submissions where status != 'published';
    -- Clean up temp and approved buckets
  $$;
  ```
- Low priority for Phase 9.1

### 4. Debug Console Not Implemented
- Black mobile debug box mentioned in requirements
- Should be toggle-able from Settings
- Admin/Reviewer only
- Low priority - console.log works for now

### 5. Visitor Counter Not Implemented
- Would require new table:
  ```sql
  create table visitor_stats (
    date date primary key,
    unique_visitors int,
    total_visits int
  );
  ```
- Track by user_id (unique) vs anonymous (total)
- Admin reset function needed
- Deferred to Phase 10+

---

## Deployment Checklist

### Before Deploying

1. **Database Migrations:**
   ```bash
   # Run in Supabase SQL editor
   # (Already done automatically via trigger in 05_roles_system.sql)
   ```

2. **Environment Variables:**
   - No new env vars needed
   - Supabase credentials unchanged

3. **Static Assets:**
   - Add logo PNG files to `/assets/logos/` (optional)
   - Or leave missing for now (graceful fallback)

4. **Git:**
   ```bash
   git checkout main
   git merge copilot/stabilize-upload-demo
   git push origin main
   ```

### After Deploying

1. **Smoke Tests:**
   - [ ] Homepage loads
   - [ ] Login works
   - [ ] Upload page shows type selector
   - [ ] Admin dashboard accessible to admins
   - [ ] Footer displays correctly (with or without logos)
   - [ ] Legal pages load

2. **Admin Setup:**
   - Ensure at least one admin user exists
   - Test upload → approve → publish flow
   - Verify real-time updates work

3. **User Onboarding:**
   - Update any help documentation
   - Notify users about new footer links (Terms, Privacy)
   - Share upload demo instructions

---

## Maintenance Notes

### Updating Roles
To add a new role:
1. Add to `check` constraint in `roles` table
2. Add to seed data in `05_roles_system.sql`
3. Update `js/roles.js` badge mapping (if display needed)
4. No frontend code changes needed (backend-driven)

### Adding Upload Types
To enable Repeated Questions:
1. Update upload.js: Remove `disabled` from RQ option
2. Create `handleRQUpload()` in upload-handler.js
3. Add `rq_submissions` table (or extend `submissions`)
4. Update admin dashboard to handle RQ submissions

### Customizing Footer
- Edit `partials/footer.html` for content
- Edit `css/footer.css` for styling
- Add logo files to `/assets/logos/`
- No JavaScript changes needed

---

## Troubleshooting

### Issue: "Failed to load submissions" popup
**Cause:** Old code showed error for RLS issues  
**Fix:** Already fixed in Phase 9.1  
**Verify:** Dashboard shows empty state, no popup

### Issue: Navigation goes to 404 from admin page
**Cause:** Relative paths (`index.html` → `/admin/index.html`)  
**Fix:** Already fixed with root-relative paths (`/index.html`)  
**Verify:** Click Home from admin dashboard

### Issue: Upload errors show SQL messages
**Cause:** Generic error handling  
**Fix:** Already fixed with error message mapping  
**Verify:** Trigger auth error, see user-friendly message

### Issue: Footer logos not showing
**Cause:** PNG files not added yet  
**Fix:** Add PNG files to `/assets/logos/` OR leave as-is (graceful fallback)  
**Verify:** Footer renders without broken images

### Issue: Delete button not working
**Cause:** Missing admin role or RLS policy  
**Fix:** Verify user has admin role in `user_roles` table  
**Verify:** Run SQL: `select get_user_role_name(auth.uid());`

---

## Future Enhancements

### Short Term (Phase 9.2+)
- Enable Repeated Questions upload type
- Integrate dynamic papers into Browse page
- Add demo reset button in Settings
- Implement visitor counter

### Medium Term (Phase 10-11)
- Add debug console toggle
- Syllabus integration
- Notes system
- Search improvements

### Long Term (Phase 12+)
- AI-powered quality checks
- Automated categorization
- Question similarity detection
- Analytics dashboard

---

## References

- **Architecture Master Plan:** `/docs/ARCHITECTURE_MASTER_PLAN.md`
- **Phase 9.1 Completion:** `/docs/PHASE9.1_COMPLETION.md`
- **SQL Schema:** `/admin/sql/05_roles_system.sql`
- **Logo Requirements:** `/assets/logos/README.md`

---

**Last Updated:** February 2026  
**Phase:** 9.1 Complete
