# Phase 8 — Role System Trust Enforcement & Documentation Overhaul

**Document Version**: 1.0  
**Date**: 2026-01-31  
**Status**: ✅ Complete

---

## Executive Summary

Phase 8 enforces **strict role system integrity** and establishes **permanent role contracts** to prevent UI role mismatches (e.g., admin users seeing "Contributor" badges). This phase also completes documentation cleanup and establishes planning frameworks for future phases.

**Key Achievements**:
- ✅ Enforced single role source (`window.__APP_ROLE__`)
- ✅ Added case-insensitive role normalization
- ✅ Removed deprecated role functions
- ✅ Updated Phase 7 documentation with role contracts
- ✅ Organized legacy documentation
- ✅ Created future phase planning documents

---

## Table of Contents

1. [Role System Fixes](#role-system-fixes)
2. [Admin Trust Enforcement](#admin-trust-enforcement)
3. [UI Gating Rules](#ui-gating-rules)
4. [Documentation Structure](#documentation-structure)
5. [Alignment with Phase 6 Pipelines](#alignment-with-phase-6-pipelines)
6. [AI Policy](#ai-policy)
7. [Future Roadmap](#future-roadmap)

---

## Role System Fixes

### Problem Statement

**Admin Badge Bug**: Admin users saw "Contributor" badge instead of "Admin" badge due to:
- Race conditions in role resolution
- Multiple sources of truth for role state
- Case-sensitive role handling
- Deprecated functions with inconsistent behavior

### Solution: Single Source of Truth

**Contract**: `window.__APP_ROLE__` is the **permanent, single source** for UI role state.

#### Structure
```javascript
window.__APP_ROLE__ = {
  status: 'admin' | 'reviewer' | 'user' | 'guest',  // Normalized role
  badge: 'Admin' | 'Moderator' | 'Contributor' | 'Guest',  // Display name
  ready: boolean  // TRUE when role resolution complete
}
```

#### Initialization Flow
1. App loads → `common.js` calls `initializeGlobalRoleState()`
2. Fetches user profile from Supabase (if authenticated)
3. **Normalizes role** using `normalizeRole()` (case-insensitive)
4. Sets `window.__APP_ROLE__` with normalized values
5. Dispatches `role:ready` event
6. UI components render role-dependent features

### Role Normalization

**Function**: `normalizeRole(role)`

**Purpose**: Ensure case-insensitive role handling

**Examples**:
- `ADMIN` → `'admin'`
- `Admin` → `'admin'`
- `admin` → `'admin'`
- `null` → `'guest'`
- `undefined` → `'guest'`
- `'unknown_role'` → `'guest'` (with warning)

**Implementation** (in `js/roles.js`):
```javascript
export function normalizeRole(role) {
  if (!role || typeof role !== 'string') {
    return 'guest';
  }
  
  const normalized = role.toLowerCase().trim();
  
  if (normalized === 'admin' || normalized === 'reviewer' || 
      normalized === 'user' || normalized === 'guest') {
    return normalized;
  }
  
  console.warn('[ROLE] Unknown role:', role, '- defaulting to guest');
  return 'guest';
}
```

### Deprecated Functions Removed

**Phase 8 removed the following functions** from `js/roles.js`:

❌ `getUserRole(useCache)` - Async function fetching from Supabase  
❌ `getCurrentUserRole(useCache)` - Async function returning role object  
❌ `isAdmin(useCache)` - Async admin check  
❌ `getRoleBadge(roleName)` - Badge info lookup

**Why removed**: These functions created multiple sources of truth and allowed UI components to bypass `window.__APP_ROLE__`, causing race conditions.

### Updated Functions

**`hasPermission(permission)`**:
- Was: `async function hasPermission(permission, useCache)`
- Now: `function hasPermission(permission)` (synchronous)
- Uses `window.__APP_ROLE__.status` directly

**`isReviewer()`**:
- Was: `async function isReviewer(useCache)`
- Now: `function isReviewer()` (synchronous)
- Uses `window.__APP_ROLE__.status` directly

---

## Admin Trust Enforcement

### Principles

1. **Admins are trusted**: Once a user has `role = 'admin'` in Supabase, they have full access
2. **No fallback rendering**: UI must never show default badges before role is ready
3. **No guessing**: UI must wait for role state, not assume guest/user
4. **Case-insensitive**: ADMIN, Admin, admin all resolve to 'admin'

### Admin Access Gates

**Profile Panel** (`js/profile-panel.js`):
```javascript
async function renderProfilePanel() {
  await waitForRoleReady();  // MANDATORY GATE
  
  const userIsAdmin = window.__APP_ROLE__.status === 'admin';
  
  if (userIsAdmin) {
    // Show Admin Dashboard link
  }
}
```

**Admin Dashboard** (`admin/dashboard.js`):
```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const roleState = await waitForRole();  // MANDATORY GATE
  
  if (roleState.status === 'admin') {
    // Grant access
  } else {
    // Show access denied
  }
});
```

### Badge Rendering

**Centralized Functions** (in `js/roles.js`):

```javascript
// Badge name mapping
export function mapRoleToBadge(role) {
  switch (role) {
    case 'admin': return 'Admin';
    case 'reviewer': return 'Moderator';
    case 'user': return 'Contributor';
    case 'guest': return 'Guest';
    default: return 'Guest';
  }
}

// Badge icon mapping
export function getBadgeIcon(badgeName) {
  const icons = {
    'Admin': '👑',
    'Moderator': '🛡️',
    'Contributor': '📝',
    'Guest': '👤'
  };
  return icons[badgeName] || '✓';
}

// Badge color mapping
export function getBadgeColor(role) {
  const colors = {
    'admin': '#f44336',
    'reviewer': '#2196F3',
    'user': '#4CAF50',
    'guest': '#9E9E9E'
  };
  return colors[role] || '#9E9E9E';
}
```

❌ **NEVER hardcode badge names or colors in UI components**

---

## UI Gating Rules

### Rule 1: Single Source of Truth

✅ **USE**: `window.__APP_ROLE__.status` for role checks  
❌ **BAN**: Direct Supabase role reads in UI components  
❌ **BAN**: Deprecated functions (listed above)

### Rule 2: Mandatory Waiting

All role-dependent UI MUST wait for `role:ready`:

```javascript
// Helper function (in js/roles.js)
export function waitForRole() {
  return new Promise((resolve) => {
    if (!window.__APP_ROLE__) {
      window.addEventListener('role:ready', () => {
        resolve(window.__APP_ROLE__);
      }, { once: true });
      return;
    }
    
    if (window.__APP_ROLE__.ready) {
      resolve(window.__APP_ROLE__);
    } else {
      window.addEventListener('role:ready', () => {
        resolve(window.__APP_ROLE__);
      }, { once: true });
    }
  });
}
```

**Usage**:
```javascript
async function renderRoleUI() {
  await waitForRole();  // BLOCKS until role is ready
  // Now safe to render
}
```

### Rule 3: No Default Rendering

❌ **WRONG**:
```javascript
// Shows "Contributor" while waiting for role
const badge = window.__APP_ROLE__?.badge || 'Contributor';
```

✅ **CORRECT**:
```javascript
// Shows nothing until role is ready
await waitForRole();
const badge = window.__APP_ROLE__.badge;
```

### Rule 4: Event-Based Reactivity

Components should listen to `role:ready` for updates:

```javascript
window.addEventListener('role:ready', () => {
  console.log('[ROLE] resolved:', window.__APP_ROLE__.status);
  renderProfilePanel();
});
```

---

## Documentation Structure

### Legacy Documentation

**Created**: `docs/legacy/` directory

**Moved**:
- `docs/legacy/PHASE4_ARCHITECTURE.md` (Raw vs Derived principles)
- `docs/legacy/PHASE5_AND_6_SUMMARY.md` (Theme system)
- `docs/legacy/PHASE6_ARCHITECTURE.md` (AI pipelines planning)

**Reason**: These docs remain valuable references but are superseded by Phase 7 and Phase 8.

### Current Documentation

**Active Docs**:
- `docs/PHASE7_ARCHITECTURE.md` - Current architecture (updated with role contracts)
- `docs/PHASE8_IMPLEMENTATION.md` - This document
- `docs/PHASE_8_2_ROLE_UI_FIX.md` - Detailed role UI fix documentation
- `docs/PHASE_8_2_TESTING_GUIDE.md` - Testing guide for role system

**Schema Docs** (LOCKED):
- `docs/schema/syllabus-schema.md`
- `docs/schema/repeated-questions-schema.md`
- `docs/schema/maps-schema.md`

---

## Alignment with Phase 6 Pipelines

### RAW → DERIVED Principle

**Phase 6 Architecture** (in legacy docs) established:
- RAW data is immutable
- DERIVED data is reproducible from RAW
- Admin approval mandatory for all public content

**Phase 8 Alignment**:
- **Role system enforces admin approval gate**
- Admins have `approve_reject` and `publish` permissions
- UI correctly shows admin features only to admin users
- No auto-publishing without admin verification

### Pipeline Trust Model

**Phase 6 Pipelines** require admin review for:
- Syllabus extraction (OCR → AI → Validation)
- Repeated Questions automation
- AI-enhanced PDFs
- Notes submissions

**Phase 8 Role System** ensures:
- Only admins see approval interfaces
- Role badges reflect trust level
- Permission checks use single source of truth
- No UI bypass of admin controls

---

## AI Policy

### Strict Rules (Enforced in Phase 8)

✅ **ALLOWED**:
- Open-source AI models (LLaMA, Mistral, Gemma)
- Free-tier APIs with generous limits (Gemini Flash, Claude Haiku)
- Local AI models (Ollama, llama.cpp)
- University-hosted AI (if available)
- AI for **draft generation only** (admin must review)

❌ **BANNED**:
- Paid-only APIs (GPT-4 Pro, Claude Sonnet without free tier)
- Auto-publish AI (AI cannot publish without admin approval)
- Student-gated AI services (requiring credit cards)
- Closed-source models with restrictive licenses

### AI as Assistant, Not Authority

**Principle**: AI generates drafts, humans approve.

**Examples**:
- AI extracts syllabus → Admin reviews and publishes
- AI matches repeated questions → Admin verifies and publishes
- AI suggests metadata → Admin confirms and commits
- AI generates notes → Admin edits and approves

**Phase 8 Role System Integration**:
- Only admins can approve AI-generated content
- UI shows AI drafts only to authorized roles
- Permission system enforces review requirements

---

## Future Roadmap

Phase 8 establishes planning docs for future phases:

### Phase 9: Repeated Questions System
**Doc**: `docs/PHASE9_RQ_SYSTEM.md`

**Planned Features**:
- RAW question papers → DERIVED RQ JSON
- AI-assisted question matching
- Admin approval workflow
- Schema: LOCKED (RQ-v1.1)
- AI: Optional, draft-only

### Phase 10: Syllabus System
**Doc**: `docs/PHASE10_SYLLABUS_SYSTEM.md`

**Planned Features**:
- RAW syllabus PDFs → DERIVED syllabus JSON
- OCR + AI extraction pipeline
- Admin verification workflow
- Schema: LOCKED (v1.0)
- AI: Optional, draft-only

### Phase 11: Notes System
**Doc**: `docs/PHASE11_NOTES_SYSTEM.md`

**Planned Features**:
- Human-authored notes with metadata
- AI-assisted note generation (drafts only)
- Contributor + Admin approval workflow
- Premium access system
- AI: Optional, draft-only

### Phase 12: AI Automation
**Doc**: `docs/PHASE12_AI_AUTOMATION.md`

**Planned Features**:
- Model-agnostic AI configuration
- Local model deployment
- Prompt template system
- Schema-driven validation
- AI: Open-source/free only

---

## Workflows Audit

### Current Workflows

**Kept** (in `.github/workflows/`):
- `auto-json.yml` - Automatic JSON generation
- `build-about-status.yml` - About page status
- `build-about-timeline.yml` - About page timeline
- `content-update.yml` - Content update automation
- `generate-pdfs.yml` - PDF generation (legacy, to review)
- `reorganize-papers.yml` - Paper organization

**To Review**: Workflows should be documented in future workflow audit.

### Workflow Alignment with Role System

**Consideration**: GitHub Actions run with admin privileges, but **manual approval steps** should respect role system:
- Actions can generate drafts
- Actions should NOT auto-publish to public
- Admins review and merge changes

---

## Static → Dynamic Migration Plan

Phase 8 establishes a migration plan document for transitioning from static hosting to dynamic features.

**Doc**: `docs/STATIC_TO_DYNAMIC_MIGRATION.md`

**Phases**:
1. **Static + Supabase Auth** (Current)
   - Static HTML/JS/CSS
   - Supabase for auth + database
   - Client-side role checking

2. **Edge Functions** (Future)
   - Supabase Edge Functions for API routes
   - Server-side role validation
   - Protected API endpoints

3. **API-Driven Pages** (Future)
   - Dynamic data loading
   - Real-time updates
   - Enhanced interactivity

4. **Optional SSR** (Far Future)
   - Astro or Next.js SSR
   - SEO optimization
   - Performance improvements

**Phase 8 Role System** is designed to work in all migration stages:
- Current: Client-side role state from Supabase
- Future: Server-side role validation with client-side caching
- SSR: Role state available during server rendering

---

## Success Criteria

### Role System
✅ Admin users see "Admin" badge (not "Contributor")  
✅ Admin Dashboard link appears for admins  
✅ Normal users see "Contributor" badge  
✅ Guests see "Guest" badge  
✅ No race conditions or badge flickering  
✅ Case-insensitive role handling (ADMIN → admin)

### Code Quality
✅ Deprecated functions removed  
✅ Single source of truth enforced  
✅ UI components use waitForRole() gates  
✅ Centralized badge mapping  
✅ No hardcoded badge values in UI

### Documentation
✅ Phase 7 updated with role contracts  
✅ Legacy docs moved to docs/legacy/  
✅ Phase 8 implementation documented  
✅ Future phase planning docs created  
✅ AI policy clearly defined

---

## Conclusion

Phase 8 establishes **permanent role system integrity** by:
1. Enforcing single source of truth (`window.__APP_ROLE__`)
2. Adding case-insensitive role normalization
3. Removing deprecated functions
4. Gating UI with mandatory role waits
5. Centralizing badge logic

This ensures **admin users are never misidentified** in the UI and establishes a **trust model** that aligns with Phase 6 pipeline architecture (RAW → DERIVED, admin approval mandatory).

**Phase 8 Status**: ✅ Complete  
**Next Phase**: Phase 9 (Repeated Questions System) or Phase 10 (Syllabus System)

---

**Document Ends**
