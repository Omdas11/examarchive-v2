# Future Phases Roadmap

**Version**: 1.0  
**Date**: 2026-01-31  
**Status**: Planning Document

---

## Overview

This document outlines the planned features and architectural changes for ExamArchive Phases 9-13, based on the solid foundation established in Phase 8.3.

---

## Phase 9: Repeated Questions (RQ) System

**Goal**: Identify and organize frequently repeated exam questions

### Features

- **Question Detection**: AI-powered question extraction from PDFs
- **Similarity Matching**: Find duplicate/similar questions across years
- **RQ Database**: Dedicated storage for repeated questions
- **Browse Interface**: User-friendly RQ browsing with filters
- **Statistics**: Show question frequency, years appeared, etc.

### Technical Stack

- **AI Model**: Google Gemini API (free tier)
- **Storage**: Supabase `repeated_questions` table
- **Frontend**: Browse page with RQ filters

### Database Schema

```sql
repeated_questions (
  id uuid primary key,
  question_text text,
  source_papers uuid[], -- array of paper IDs
  frequency int,        -- times appeared
  years int[],          -- years it appeared
  subject text,
  tags text[],
  created_at timestamptz
)
```

### Dependencies

- Phase 8.3 admin system ✅
- PDF text extraction pipeline
- AI question parser

---

## Phase 10: Syllabus System

**Goal**: Organize and display university syllabi with paper mapping

### Features

- **Syllabus Upload**: Admins upload syllabus documents
- **Paper Mapping**: Link papers to syllabus topics
- **Browse by Syllabus**: Find papers by course/topic
- **Syllabus Viewer**: Structured syllabus display

### Technical Stack

- **Storage**: Supabase `syllabus` and `syllabus_topics` tables
- **Frontend**: Syllabus browsing interface
- **Admin**: Syllabus management in admin dashboard

### Database Schema

```sql
syllabus (
  id uuid primary key,
  course_code text,
  course_name text,
  university text,
  year int,
  document_url text,
  created_at timestamptz
)

syllabus_topics (
  id uuid primary key,
  syllabus_id uuid references syllabus(id),
  topic_name text,
  unit_number int,
  related_papers uuid[], -- papers covering this topic
  created_at timestamptz
)
```

### Dependencies

- Phase 8.3 admin system ✅
- Storage system ✅

---

## Phase 11: Notes System

**Goal**: Community-contributed study notes with admin approval

### Features

- **Note Creation**: Users create markdown notes
- **Admin Review**: Notes require approval before publish
- **Note Linking**: Link notes to papers and syllabus topics
- **Rich Editor**: Markdown editor with preview
- **Search**: Full-text search in notes

### Technical Stack

- **Storage**: Supabase `notes` table
- **Editor**: SimpleMDE or similar markdown editor
- **Approval**: Via admin dashboard

### Database Schema

```sql
notes (
  id uuid primary key,
  title text,
  content text,        -- Markdown content
  author_id uuid references auth.users(id),
  related_papers uuid[],
  related_topics uuid[],
  status text check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz
)
```

### Dependencies

- Phase 8.3 admin system ✅
- Phase 10 syllabus system (for topic linking)

---

## Phase 12: AI Automation

**Goal**: Automate repetitive admin tasks with AI assistance

### Features

#### 12.1 Auto Paper Classification

- Extract paper metadata from PDF (code, year, subject)
- Suggest tags and categories
- Pre-fill upload form fields

#### 12.2 Auto Quality Check

- Verify PDF readability
- Check for duplicates
- Flag low-quality scans
- Suggest OCR for image PDFs

#### 12.3 AI Review Assistant

- Summarize paper content
- Suggest approval/rejection
- Flag suspicious uploads
- Detect copyrighted content

#### 12.4 Auto RQ Detection

- Extract questions from new papers
- Match with existing RQ database
- Auto-update RQ statistics

### Technical Stack

- **AI Provider**: Google Gemini (primary), OpenAI GPT (fallback)
- **Pipeline**: Cloud Functions or Edge Functions
- **Queues**: Supabase Realtime for job processing

### AI Model Strategy

- **Model-agnostic design**: Easy to switch providers
- **Fallback chain**: Gemini → GPT → Manual
- **Cost control**: Free tier limits, rate limiting
- **Privacy**: No data sent to AI without user consent

### Dependencies

- Phase 8.3 admin system ✅
- Phase 9 RQ system
- Cloud function infrastructure

---

## Phase 13: Advanced Features

**Goal**: Polish and advanced functionality

### 13.1 Search Improvements

- Full-text search in PDFs
- Fuzzy matching
- Advanced filters
- Search analytics

### 13.2 User Features

- User profiles
- Upload history
- Contribution stats
- Badges and achievements

### 13.3 Mobile App

- React Native or Flutter app
- Offline PDF viewing
- Push notifications
- Mobile-optimized UI

### 13.4 Analytics Dashboard

- Usage statistics
- Popular papers
- User engagement metrics
- Admin insights

### 13.5 Institution Features

- Institution-specific branding
- Private paper collections
- Custom role systems
- SSO integration

---

## Architectural Principles (All Phases)

### 1. Backend-First

- All business logic in backend
- Frontend is presentation only
- No security decisions in UI

### 2. Admin Approval

- User-generated content requires review
- AI suggestions require human verification
- Publish only after admin approval

### 3. Model-Agnostic AI

- Easy to switch AI providers
- Fallback chains for reliability
- No vendor lock-in

### 4. Student Accessibility

- Free tier AI models only
- No paid API requirements for basic features
- Open-source where possible

### 5. Clean Data Separation

- RAW storage (original uploads)
- DERIVED storage (processed/published)
- Clear data lineage

---

## Implementation Order

### Priority 1 (Next)
1. Phase 9: RQ System
2. Phase 10: Syllabus System

### Priority 2
3. Phase 11: Notes System
4. Phase 12.1: Auto Paper Classification

### Priority 3
5. Phase 12.2-12.4: AI Automation
6. Phase 13: Advanced Features

---

## Resource Requirements

### Phase 9-10
- **Time**: 2-3 weeks per phase
- **AI Usage**: ~10K API calls/month (free tier)
- **Storage**: +5GB for RQ and syllabus data

### Phase 11
- **Time**: 2 weeks
- **Storage**: +10GB for notes (text is lightweight)

### Phase 12
- **Time**: 3-4 weeks
- **AI Usage**: ~50K API calls/month
- **Compute**: Cloud Functions or Edge Functions

### Phase 13
- **Time**: Ongoing
- **Resources**: Varies by feature

---

## Success Criteria

Each phase must meet:

1. **Functional**: All features working as specified
2. **Secure**: Backend-first, no security shortcuts
3. **Tested**: Manual testing + automated tests where possible
4. **Documented**: Clear docs for users and developers
5. **Accessible**: Works on mobile + desktop
6. **Maintainable**: Clean code, no hacks

---

## Risk Mitigation

### AI Cost Control

- Use free tier models (Gemini)
- Rate limiting (per user, per day)
- Cache AI results
- Fallback to manual for edge cases

### Data Privacy

- No personal data sent to AI
- User consent for AI processing
- Data anonymization where needed
- GDPR compliance (for future)

### Scalability

- Database indexes on all query paths
- CDN for static assets
- Lazy loading for large datasets
- Pagination everywhere

---

## Phase 8.3 Foundation (Complete ✅)

The following are now solid and will not change:

- ✅ Backend-first admin system
- ✅ Role-based access control (RBAC)
- ✅ Badge system (display only)
- ✅ Admin dashboard with backend verification
- ✅ Security model (frontend ≠ security)
- ✅ Clean documentation

**All future phases build on this foundation.**

---

**Last Updated**: 2026-01-31  
**Next Review**: After Phase 9 implementation  
**See Also**: ARCHITECTURE_MASTER_PLAN.md
