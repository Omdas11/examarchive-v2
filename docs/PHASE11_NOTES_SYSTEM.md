# Phase 11 — Notes System

**Document Version**: 1.0  
**Date**: 2026-01-31  
**Status**: 📋 Planning (Not Implemented)

> ⚠️ **PLANNING ONLY**: This document outlines future work. No implementation in Phase 11.

---

## Executive Summary

Phase 11 will implement a **Notes System** that allows contributors to write and share study notes linked to exam papers. The system supports both **human-authored** and **AI-assisted** notes, with **mandatory admin approval** before publishing.

---

## Core Principles

### 1. RAW → DERIVED Pipeline

**RAW Sources**:
- Question paper PDFs (context for notes)
- Syllabus JSON (topic mapping)
- User-authored note content (markdown/rich text)

**DERIVED Outputs**:
- Published notes (HTML/markdown)
- Notes metadata (JSON)
- Notes index (searchable)

**Process**:
1. Contributor writes notes (manual or AI-assisted draft)
2. Contributor submits for review
3. Reviewer (if applicable) provides feedback
4. Admin reviews and approves
5. Notes published to public

### 2. Schema LOCKED (Future)

**Schema**: To be defined (Phase 11 planning)

**Proposed Fields**:
- `noteId` - Unique identifier
- `title` - Note title
- `subject` - Subject classification
- `topics` - Array of topics covered
- `author` - Contributor user ID
- `linkedPapers` - Papers related to notes
- `content` - Note content (markdown)
- `aiAssisted` - Boolean (was AI used?)
- `approvedBy` - Admin who approved
- `publishedDate` - Publication timestamp

❌ **Schema cannot be modified after Phase 11 implementation**

### 3. Admin Approval Mandatory

**Workflow**:
1. Contributor writes notes
2. Contributor submits for review
3. (Optional) Reviewer provides feedback
4. Admin reviews notes (checks quality, accuracy, plagiarism)
5. Admin approves or requests revisions
6. Approved notes published

**No Auto-Publishing**: AI-generated or human-authored notes must be approved by admin.

### 4. AI: Optional, Draft-Only

**AI Assistance**:
- ✅ AI can generate note drafts (from syllabus/papers)
- ✅ AI can expand outlines into content
- ✅ AI can improve grammar and formatting
- ❌ AI **cannot** auto-publish notes
- ❌ AI **cannot** bypass admin review
- ⚠️ AI-generated content must be disclosed (metadata field)

**Model Requirements**:
- Open-source or free-tier models only
- Model-agnostic architecture
- Must work without AI (human authoring)

---

## Features

### Contributor Features

**Note Writing**:
- Markdown editor with preview
- Rich text formatting (bold, italic, lists, code blocks)
- Image upload (optional)
- LaTeX math support (for equations)
- Topic tagging (links to syllabus)
- Paper linking (links to question papers)

**AI Assistance** (Optional):
- Generate outline from syllabus
- Expand outline into paragraphs
- Improve grammar and clarity
- Suggest related topics

**Submission**:
- Submit for review
- Track submission status (pending, under review, approved, rejected)
- View feedback from reviewers/admins

### Reviewer Features

**Review Dashboard**:
- View pending notes submissions
- Provide feedback and suggestions
- Recommend approval or rejection
- Flag plagiarism or quality issues

### Admin Features

**Approval Dashboard**:
- View all notes submissions
- Review content and metadata
- Check for plagiarism (manual or tool-assisted)
- Approve or reject notes
- Request revisions
- Publish approved notes

### User/Guest Features

**Browse Notes**:
- Browse notes by subject/topic
- Search notes by keywords
- Filter by paper/year
- View contributor profile
- Rate notes (optional, future feature)

---

## Premium Access (Optional)

### Concept

Some notes may be marked as **premium** and require:
- Earned access (by contributing content)
- Subscription (free for contributors, paid for guests)
- Admin discretion (gifted access)

**Trust-Based Access**:
- **High trust contributors** (80-100 trust score): Full access
- **Active contributors** (uploaded 5+ papers): Partial access
- **Regular users**: Limited access
- **Guests**: No premium access

**Not in Phase 11**: Premium system is optional and can be added later.

---

## Permission Requirements

**Roles**:
- **Admin**: Full access (review, approve, publish all notes)
- **Reviewer**: Can review notes (cannot publish)
- **User**: Can write and submit notes (cannot publish)
- **Guest**: Can view published notes (cannot write)

**Admin Permissions**:
- `review_submissions`
- `approve_reject`
- `publish`

**Contributor Permissions**:
- `upload_pending` (submit notes)
- `view_public` (view published notes)

---

## AI Policy

### Allowed Models

**Open-Source**:
- ✅ LLaMA 3 (content generation)
- ✅ Mistral (outline expansion)
- ✅ Gemma (grammar improvement)

**Free-Tier APIs**:
- ✅ Gemini Flash (content generation)
- ✅ Claude Haiku (grammar/style)

**Local Models**:
- ✅ Ollama (local LLM)

### Prohibited

❌ Paid-only APIs  
❌ Auto-publishing AI  
❌ Undisclosed AI usage (must mark `aiAssisted: true`)

### AI Disclosure

**Requirement**: Notes metadata must include `aiAssisted` field:
- `true` - AI was used to generate or assist with content
- `false` - Fully human-authored

**Display**: UI should indicate AI-assisted notes with a badge (e.g., "🤖 AI-Assisted")

---

## Implementation Checklist (Future)

### Backend
- [ ] Create notes submission API
- [ ] Build notes review workflow
- [ ] Add admin approval endpoints
- [ ] Implement notes storage (Supabase or file-based)
- [ ] Add plagiarism detection (optional)

### UI
- [ ] Notes writing/editing page
- [ ] Notes submission interface
- [ ] Admin notes review dashboard
- [ ] Notes browse/search page
- [ ] Notes display page

### AI Integration
- [ ] AI outline generation
- [ ] AI content expansion
- [ ] AI grammar improvement
- [ ] AI disclosure in metadata

### Testing
- [ ] Test notes submission workflow
- [ ] Test admin approval flow
- [ ] Test AI assistance features
- [ ] Test notes display and search

### Documentation
- [ ] Contributor guide (how to write notes)
- [ ] Admin review manual
- [ ] AI assistance guide

---

## Success Criteria

### Functional
✅ Contributors can write and submit notes  
✅ Admins can review and approve notes  
✅ Approved notes published on platform  
✅ Notes linked to papers and topics  
✅ AI assistance available (optional)

### Non-Functional
✅ Works without AI (human authoring)  
✅ Uses only open-source or free AI  
✅ No auto-publishing  
✅ AI usage disclosed in metadata

---

## Open Questions

- **Plagiarism Detection**: Which tool to use? (Turnitin not accessible)
- **Image Hosting**: Store images in Supabase or Cloudflare R2?
- **Math Rendering**: KaTeX or MathJax for LaTeX equations?
- **Version Control**: Allow note updates? How to handle versioning?

---

**Phase 11 Status**: 📋 Planning  
**Blocked By**: Admin dashboard UI, schema definition  
**Next Steps**: Define notes schema, prototype editor

---

**Document Ends**
