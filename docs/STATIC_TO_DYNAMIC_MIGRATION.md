# Static to Dynamic Migration Plan

**Document Version**: 1.0  
**Date**: 2026-01-31  
**Status**: 📋 Planning

---

## Executive Summary

This document outlines a **phased migration plan** from the current static HTML/JS architecture to a more dynamic, API-driven architecture. The migration preserves the existing role system (Phase 8) and RAW → DERIVED principles (Phase 6) while enabling advanced features.

---

## Current Architecture (Phase 1)

### Static + Supabase Auth

**Status**: ✅ Current Implementation

**Tech Stack**:
- HTML/CSS/JavaScript (vanilla)
- Static hosting (GitHub Pages)
- Supabase (authentication + database)
- Client-side role checking

**Components**:
- Static HTML pages (index.html, browse.html, paper.html, etc.)
- Client-side JavaScript (js/roles.js, js/profile-panel.js, etc.)
- JSON data files (data/papers.json, data/syllabus/, etc.)
- Supabase for auth and user profiles
- `window.__APP_ROLE__` for role state

**Advantages**:
- ✅ Simple deployment (GitHub Pages)
- ✅ Fast page loads (static HTML)
- ✅ No server maintenance
- ✅ Free hosting

**Limitations**:
- ❌ Client-side role checks (can be bypassed)
- ❌ No server-side validation
- ❌ Limited real-time features
- ❌ Manual data updates (via GitHub Actions)

**Phase 8 Alignment**:
- ✅ Role system (`window.__APP_ROLE__`) works in static context
- ✅ Client-side role gates for UI
- ✅ Supabase RLS for backend security

---

## Phase 2: Edge Functions

### Serverless API Layer

**Status**: 📋 Planned (Future)

**Tech Stack**:
- Supabase Edge Functions (Deno)
- Same static frontend
- Server-side API routes
- Enhanced security

**New Components**:
- `/supabase/functions/` - Edge Function definitions
  - `approve-content` - Admin approval endpoint
  - `validate-upload` - Server-side upload validation
  - `generate-rq` - RQ generation (AI-assisted)
  - `extract-syllabus` - Syllabus extraction (AI-assisted)

**Benefits**:
- ✅ Server-side role validation
- ✅ Protected API endpoints
- ✅ Secrets management (API keys on server)
- ✅ Real-time data processing
- ✅ Webhook support

**Migration Steps**:
1. Create Supabase Edge Functions for admin operations
2. Move sensitive operations (approval, publishing) to Edge Functions
3. Update frontend to call Edge Functions instead of direct database access
4. Add server-side role validation
5. Keep static HTML pages (no change)

**Example Edge Function** (`approve-content.ts`):
```typescript
// supabase/functions/approve-content/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Authenticate user
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );
  
  // Get user role (server-side)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  // Validate admin role (server-side)
  if (profile?.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Approve content (admin-only operation)
  const { contentId } = await req.json();
  const { data, error } = await supabase
    .from('submissions')
    .update({ status: 'approved', approved_by: user.id })
    .eq('id', contentId);
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

**Phase 8 Role System Integration**:
- ✅ Client-side: `window.__APP_ROLE__` still used for UI
- ✅ Server-side: Edge Functions validate role from database
- ✅ Double validation: Client (UI) + Server (security)

---

## Phase 3: API-Driven Pages

### Dynamic Data Loading

**Status**: 📋 Planned (Future)

**Tech Stack**:
- Same static HTML shell
- JavaScript fetches data from APIs
- Real-time updates via Supabase Realtime
- Enhanced interactivity

**Changes**:
- **Browse Page**: Load papers dynamically from API (not from papers.json)
- **Admin Dashboard**: Real-time submission updates
- **Notes System**: Dynamic note loading and rendering
- **Search**: Server-side search API (faster, more powerful)

**Migration Steps**:
1. Create API endpoints for data fetching
2. Replace static JSON loading with API calls
3. Add loading states and error handling
4. Enable real-time updates (Supabase Realtime)
5. Keep HTML structure (no framework needed yet)

**Example API-Driven Browse**:
```javascript
// Before (Static JSON)
const papers = await fetch('/data/papers.json').then(r => r.json());

// After (API-Driven)
const papers = await fetch('/api/papers?programme=bsc&subject=physics')
  .then(r => r.json());
```

**Benefits**:
- ✅ Real-time data updates
- ✅ Pagination and filtering (server-side)
- ✅ Faster search (database queries)
- ✅ Dynamic content loading

**Phase 8 Role System Integration**:
- ✅ `window.__APP_ROLE__` still primary UI state
- ✅ APIs validate role server-side
- ✅ Real-time updates respect role permissions

---

## Phase 4: Optional SSR (Server-Side Rendering)

### Framework-Based SSR

**Status**: 📋 Planned (Far Future)

**Tech Stack Options**:

**Option A: Astro**
- Static-first with optional SSR
- Minimal JavaScript
- Great for content sites
- Easy migration from static HTML

**Option B: Next.js**
- React-based SSR
- Full-stack framework
- API routes included
- Larger learning curve

**Recommendation**: Astro (better fit for content-heavy site)

**Benefits**:
- ✅ SEO optimization (pre-rendered HTML)
- ✅ Faster initial page load
- ✅ Better performance
- ✅ Modern developer experience

**Migration Steps**:
1. Choose framework (Astro recommended)
2. Convert HTML pages to framework components
3. Migrate JavaScript to framework patterns
4. Set up SSR for dynamic pages
5. Deploy to hosting with SSR support (Vercel, Netlify, Cloudflare Pages)

**Astro Example** (browse.astro):
```astro
---
// Server-side code (runs at build or request time)
import { supabase } from '../lib/supabase';

const { data: papers } = await supabase
  .from('papers')
  .select('*')
  .eq('status', 'published');
---

<html>
  <head>
    <title>Browse Papers</title>
  </head>
  <body>
    <h1>Browse Papers</h1>
    <ul>
      {papers.map(paper => (
        <li>{paper.title}</li>
      ))}
    </ul>
  </body>
</html>
```

**Phase 8 Role System Integration**:
- ⚠️ Needs update: `window.__APP_ROLE__` becomes SSR context
- ✅ Role resolved server-side during page render
- ✅ Client-side hydration maintains role state
- ✅ Seamless upgrade from Phase 1 role system

---

## Migration Timeline

### Immediate (Current - Phase 1)
- ✅ Static HTML + Supabase Auth
- ✅ Client-side role system (`window.__APP_ROLE__`)
- ✅ JSON data files
- ✅ GitHub Actions for automation

### Short-Term (6-12 months - Phase 2)
- 📋 Supabase Edge Functions
- 📋 Server-side role validation
- 📋 Protected API endpoints
- 📋 Admin approval APIs

### Medium-Term (1-2 years - Phase 3)
- 📋 API-driven data loading
- 📋 Real-time updates
- 📋 Server-side search
- 📋 Dynamic browse page

### Long-Term (2+ years - Phase 4)
- 📋 Astro or Next.js SSR (optional)
- 📋 Pre-rendered pages
- 📋 SEO optimization
- 📋 Modern framework

---

## Principles Preserved Across All Phases

### RAW → DERIVED (Phase 6)
- ✅ Phase 1-4: RAW PDFs remain immutable
- ✅ Phase 1-4: DERIVED data regenerated from RAW
- ✅ Phase 1-4: Admin approval mandatory

### Role System (Phase 8)
- ✅ Phase 1: `window.__APP_ROLE__` (client-side)
- ✅ Phase 2: `window.__APP_ROLE__` + server validation
- ✅ Phase 3: `window.__APP_ROLE__` + API validation
- ✅ Phase 4: SSR context + client hydration

### AI Policy (Phase 8)
- ✅ Phase 1-4: Open-source or free AI only
- ✅ Phase 1-4: AI as draft generator (not authority)
- ✅ Phase 1-4: Admin approval mandatory

### Schema Locking
- ✅ Phase 1-4: Schemas remain locked
- ✅ Phase 1-4: Validation enforced at all layers

---

## Technology Recommendations

### Phase 1 (Current)
- **Hosting**: GitHub Pages (free, simple)
- **Auth**: Supabase (free tier sufficient)
- **Database**: Supabase (free tier sufficient)
- **Storage**: GitHub repository (papers, data)

### Phase 2 (Edge Functions)
- **Hosting**: GitHub Pages (frontend) + Supabase (backend)
- **Functions**: Supabase Edge Functions (free tier, then paid)
- **Auth**: Supabase
- **Database**: Supabase

### Phase 3 (API-Driven)
- **Hosting**: GitHub Pages (frontend) + Supabase (backend)
- **APIs**: Supabase Edge Functions + Supabase Database
- **Real-time**: Supabase Realtime
- **Storage**: Cloudflare R2 (optional, for large files)

### Phase 4 (SSR)
- **Hosting**: Vercel (Astro/Next.js) or Cloudflare Pages (Astro)
- **Framework**: Astro (recommended) or Next.js
- **Auth**: Supabase
- **Database**: Supabase
- **Storage**: Cloudflare R2

---

## Cost Analysis

### Phase 1 (Current)
- **Hosting**: $0 (GitHub Pages)
- **Auth + Database**: $0 (Supabase free tier)
- **Total**: $0/month

### Phase 2 (Edge Functions)
- **Hosting**: $0 (GitHub Pages)
- **Auth + Database**: $0-25 (Supabase free tier → Pro if needed)
- **Edge Functions**: $0-25 (Supabase free tier → paid if heavy usage)
- **Total**: $0-50/month

### Phase 3 (API-Driven)
- **Hosting**: $0 (GitHub Pages)
- **Auth + Database**: $25 (Supabase Pro recommended)
- **Edge Functions**: Included in Supabase Pro
- **Total**: $25/month

### Phase 4 (SSR)
- **Hosting**: $0-20 (Vercel Hobby/Pro or Cloudflare Pages free/paid)
- **Auth + Database**: $25 (Supabase Pro)
- **Total**: $25-45/month

**Affordability**: All phases remain affordable for student projects.

---

## Decision Points

### When to Move to Phase 2?

**Triggers**:
- Need server-side role validation
- Want to add AI-assisted features (require API keys)
- Need webhook integrations
- Want real-time admin approvals

**Blockers**:
- Supabase Edge Functions learning curve
- Need to test serverless deployment
- Cost considerations (if exceeding free tier)

### When to Move to Phase 3?

**Triggers**:
- Static JSON files too large (performance issue)
- Need real-time data updates
- Want advanced search/filtering
- Growing user base (need database queries)

**Blockers**:
- Need to redesign data fetching
- Potential UI refactoring
- Database query optimization needed

### When to Move to Phase 4?

**Triggers**:
- SEO is critical
- Need faster initial page loads
- Want modern developer experience
- Growing development team

**Blockers**:
- Framework learning curve
- Complete frontend refactor
- Hosting migration
- Testing SSR setup

---

## Conclusion

The migration from static to dynamic is **gradual and optional**. Phase 1 (current) is sufficient for small to medium-sized content. Each phase adds capabilities while preserving core principles (RAW → DERIVED, role system, AI policy).

**Recommendation**: Stay in Phase 1 until triggers justify migration. Monitor user growth and feature needs to decide when to move to Phase 2 or beyond.

---

**Document Ends**
