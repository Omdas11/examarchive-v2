# Phase 7 — Web Architecture & AI Automation Planning

**Document Version**: 1.0  
**Date**: 2026-01-30  
**Status**: 📋 Architecture Planning (Design Only)

> ⚠️ **CRITICAL: THIS IS PLANNING ONLY**  
> ❌ No feature implementation  
> ❌ No UI pages  
> ❌ No backend pipelines  
> ❌ No AI execution  
> ✅ Documentation updates allowed  
> ✅ Empty folders may be created if justified  
> ✅ Unused / legacy files may be removed with justification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Context & Alignment](#context--alignment)
3. [Core Principles (Non-Negotiable)](#core-principles-non-negotiable)
4. [What Changes vs What Does Not Change](#what-changes-vs-what-does-not-change)
5. [Proposed Folder Structure](#proposed-folder-structure)
6. [Pipeline Architecture: RAW → Browse Cards](#pipeline-architecture-raw--browse-cards)
7. [Pipeline Architecture: RAW → AI-Enhanced PDFs](#pipeline-architecture-raw--ai-enhanced-pdfs)
8. [Pipeline Architecture: RAW → Repeated Questions](#pipeline-architecture-raw--repeated-questions)
9. [Notes System Architecture](#notes-system-architecture)
10. [Admin Review Workflow](#admin-review-workflow)
11. [Roles, Badges & Trust Model](#roles-badges--trust-model)
12. [AI Safety & Model-Agnostic Design](#ai-safety--model-agnostic-design)
13. [File Cleanup & Legacy Removal](#file-cleanup--legacy-removal)
14. [Implementation Roadmap](#implementation-roadmap)
15. [Success Criteria](#success-criteria)

---

## Executive Summary

Phase 7 transforms the architectural vision from Phase 4 and Phase 6 into a **formal, production-ready web architecture plan** for ExamArchive-v2. This document defines how the platform will:

- Support **AI-assisted and human-generated content** with mandatory admin approval
- Maintain **clean separation of RAW vs DERIVED data**
- Enable **trust-based contributor validation**
- Use only **open-source or student-accessible AI models**
- Provide **admin-verified publishing workflows** for all public content

**Key Achievement**: A clear, scalable architecture that respects all Phase 4-6 decisions while enabling future AI automation without compromising academic integrity or student accessibility.

---

## Context & Alignment

### Mandatory References (Reviewed)

This architecture **builds upon and respects** all decisions from:

✅ **docs/PHASE4_ARCHITECTURE.md**
- Raw vs Derived data separation principle
- PDF storage strategy (GitHub → Supabase → R2)
- Metadata-driven architecture
- Schema-first design approach
- JSON as contract philosophy

✅ **docs/PHASE6_ARCHITECTURE.md**
- Syllabus extraction pipeline (OCR → AI → Validation)
- Repeated Questions automation workflow
- Notes & Premium system design
- Browse page enhancement concepts
- Storage tier recommendations

✅ **docs/PHASE5_AND_6_SUMMARY.md**
- Theme system architecture
- Font system implementation
- UI consistency standards

✅ **Existing Schemas (LOCKED)**
- `docs/schema/syllabus-schema.md` (v1.0 LOCKED)
- `docs/schema/repeated-questions-schema.md` (RQ-v1.1 LOCKED)
- `docs/schema/maps-schema.md` (LOCKED)

### Current Repository State

**Assets**:
- `/papers/assam-university/` - PDF storage (organized by programme/subject)
- `/data/syllabus/` - Syllabus JSON files (manually created)
- `/data/repeated-questions/` - RQ JSON files (manually created)
- `/data/papers.json` - Central paper registry
- `/maps/` - Paper metadata maps (CBCS/FYUG)

**Schemas**: All existing schemas are LOCKED and must not be modified.

**UI Pages**: browse.html, paper.html, settings.html, about.html, upload.html

---

## Core Principles (Non-Negotiable)

### 1. RAW is Immutable

> **Rule**: Original academic documents are never modified after upload.

- Raw PDFs = authoritative source of truth
- Never edit raw files
- Preserve original formatting and content
- Version control for corrections only

### 2. DERIVED is Reproducible

> **Rule**: Generated content can be regenerated from raw sources.

- Syllabus JSON = extracted from raw syllabus PDFs
- RQ JSON = extracted from raw question paper PDFs
- AI-enhanced PDFs = processed from raw PDFs
- Notes = authored separately, metadata-linked

### 3. Admin Approval is Mandatory

> **Rule**: Nothing becomes public without admin verification.

All content types require admin approval:
- ✅ Browse card metadata
- ✅ AI-enhanced PDFs
- ✅ Repeated Questions (JSON and optional PDF)
- ✅ Syllabus JSON
- ✅ Notes (human or AI-assisted)

### 4. AI Must Be Safe and Accessible

> **Rule**: Only open-source or free student-accessible AI models.

**Allowed**:
- ✅ Open-source models (LLaMA, Mistral, Gemma)
- ✅ Free-tier APIs with generous limits (Gemini Flash, Claude Haiku)
- ✅ Local models (Ollama, llama.cpp)
- ✅ University-hosted models (if available)

**Prohibited**:
- ❌ Paid-only APIs (GPT-4, Claude Sonnet without free tier)
- ❌ Hard dependency on commercial AI
- ❌ Student-gated AI services

### 5. Model-Agnostic Architecture

> **Rule**: AI pipelines must work with any compatible model.

- Configuration-based model selection
- Prompt templates separate from code
- Schema-driven output validation
- Fallback to manual process if AI unavailable

### 6. Draft by Default

> **Rule**: All AI output starts as draft, never auto-published.

Status lifecycle:
```
draft → needs_review → approved/rejected → published
```

---

## What Changes vs What Does Not Change

### ✅ WHAT CHANGES

**Folder Structure**:
- New `/storage/raw/` directory for future raw file organization
- New `/storage/derived/` directory for generated content
- New `/ai/` directory for AI prompts and schemas
- New `/admin/` directory for review queue metadata

**Documentation**:
- This Phase 7 document
- Updated README references (if needed)

**Legacy Cleanup**:
- Remove `data/papers-legacy.txt` (obsolete format)
- Document unused files (demo/ may be kept for testing)

### ❌ WHAT DOES NOT CHANGE

**Existing Data**:
- All current PDFs remain untouched
- All existing JSON files remain valid
- Current papers.json structure unchanged
- All schemas remain LOCKED

**Existing Pages**:
- browse.html structure unchanged
- paper.html structure unchanged
- All UI pages continue to work

**Existing Features**:
- Browse page continues to function
- Paper page continues to display syllabi and RQ
- Theme system remains operational
- Settings page continues to work

**Build Scripts**:
- `scripts/generate-papers.js` - unchanged
- `scripts/generate-syllabus-pdf.js` - unchanged
- All existing automation continues to work

---

## Proposed Folder Structure

### Overview

The architecture introduces **logical separation** between raw authoritative sources, derived/generated content, and operational metadata:

```
examarchive-v2/
├── storage/                    # Future storage layer (design only)
│   ├── raw/                    # Authoritative academic sources
│   │   ├── papers/             # Original question papers
│   │   ├── syllabus/           # Original syllabus PDFs
│   │   └── references/         # Textbooks, additional materials
│   └── derived/                # Generated content
│       ├── syllabus-json/      # Extracted syllabus JSON
│       ├── rq-json/            # Extracted RQ JSON
│       ├── rq-pdf/             # Generated RQ PDF (optional)
│       ├── ai-pdfs/            # AI-enhanced PDFs
│       └── notes/              # Study notes
│           ├── public/         # Free access notes
│           └── premium/        # Premium notes
├── ai/                         # AI configuration (future)
│   ├── prompts/                # Reusable prompt templates
│   │   ├── syllabus-extraction.txt
│   │   ├── rq-extraction.txt
│   │   └── pdf-enhancement.txt
│   └── schemas/                # JSON schemas for validation
│       ├── browse-card.schema.json
│       ├── syllabus.schema.json (reference)
│       └── rq.schema.json (reference)
├── admin/                      # Admin workflow metadata
│   └── review-queues/          # Pending review items
│       ├── browse-cards.json   # Draft browse cards
│       ├── syllabus.json       # Draft syllabus extractions
│       ├── rq.json             # Draft RQ extractions
│       └── notes.json          # Draft notes submissions
├── data/                       # Current data (unchanged)
│   ├── papers.json
│   ├── syllabus/
│   ├── repeated-questions/
│   └── registry/
├── papers/                     # Current PDF storage (unchanged)
├── docs/                       # Documentation
└── [existing structure...]     # All other files unchanged
```

### Directory Justification

#### `/storage/` (Design Only - Empty Folder Creation Optional)

**Purpose**: Future-ready storage layer for clean separation of raw and derived content.

**Why Empty Folders Now**:
- Establishes architectural intent
- Makes future migration clearer
- Documents intended structure
- No implementation required yet

**Decision**: Create `/storage/raw/` and `/storage/derived/` as empty directories with README.md explaining their future purpose.

#### `/ai/` (Design Only - Empty Folder Creation Recommended)

**Purpose**: Centralize all AI-related configuration, making it easy to:
- Update prompts without code changes
- Version control AI behavior
- Swap AI models via config
- Audit AI usage

**Contents** (Future):
- `/ai/prompts/` - Text files with prompt templates
- `/ai/schemas/` - JSON schemas for validation

**Decision**: Create `/ai/prompts/` and `/ai/schemas/` with README.md explaining usage.

#### `/admin/` (Design Only - Empty Folder Creation Recommended)

**Purpose**: Track items pending admin review separately from published data.

**Why Separate**:
- Draft content doesn't pollute production data
- Easy to see what needs review
- Audit trail for approvals
- Rollback capability

**Decision**: Create `/admin/review-queues/` with README.md explaining workflow.

---

## Pipeline Architecture: RAW → Browse Cards

### Goal

Generate **metadata-rich browse cards** from uploaded question papers, with confidence scoring and admin approval before visibility.

### Pipeline Stages

```
┌─────────────────────┐
│  1. PDF Upload      │  User uploads question paper PDF
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  2. Metadata        │  Extract: year, programme, subject, paper code
│     Extraction      │  Tools: Filename parsing, OCR for header
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  3. Validation      │  Check: valid paper code, matches map schema
│                     │  Confidence: High / Medium / Low
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  4. Draft Card      │  Generate JSON following maps schema
│     Generation      │  Status: draft
│                     │  Save to: admin/review-queues/browse-cards.json
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  5. Admin Review    │  Admin verifies: metadata, paper quality
│     (Manual)        │  Decision: approve / reject / request corrections
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  6. Publish         │  If approved: Update data/papers.json
│                     │  PDF moves to: papers/assam-university/...
│                     │  Status: published
└─────────────────────┘
```

### Confidence Scoring

**High Confidence (90-100%)**:
- Paper code matches known map
- Filename follows convention
- Year is valid (2000-2099)
- Programme detected (CBCS/FYUG)

**Medium Confidence (50-89%)**:
- Paper code partially matches
- Year detected but unusual
- Programme inferred, not explicit

**Low Confidence (0-49%)**:
- No map match found
- Filename non-standard
- OCR required for metadata
- Manual review strongly recommended

### Output Format

Draft browse card (saved to admin/review-queues/browse-cards.json):

```json
{
  "id": "draft-abc123",
  "status": "needs_review",
  "confidence_score": 85,
  "uploaded_at": "2026-01-30T08:00:00Z",
  "uploaded_by": "user@example.com",
  "extracted_metadata": {
    "university": "Assam University",
    "programme": "FYUG",
    "subject": "physics",
    "paper_code": "PHYDSC101T",
    "year": 2023,
    "pdf_path": "/temp/uploads/draft-abc123.pdf"
  },
  "validation": {
    "paper_code_valid": true,
    "map_found": true,
    "year_valid": true
  },
  "admin_notes": "",
  "review_history": []
}
```

### Admin Actions

```
Approve → Merge to papers.json + Move PDF to papers/
Reject → Delete draft + Notify uploader
Request Changes → Flag for uploader with corrections needed
```

---

## Pipeline Architecture: RAW → AI-Enhanced PDFs

### Goal

Create **cleaned, normalized question paper PDFs** with improved readability while preserving academic content integrity.

### Pipeline Stages

```
┌─────────────────────┐
│  1. Source PDF      │  Input: Original question paper PDF
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  2. OCR + Layout    │  Extract: text, layout, formatting
│     Analysis        │  Detect: headers, questions, sections, units
│                     │  Tools: Tesseract.js, PDF.js
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  3. Content         │  Normalize: fonts, spacing, alignment
│     Normalization   │  Fix: OCR errors, broken formatting
│                     │  Preserve: academic content exactly
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  4. AI Enhancement  │  Clean: artifacts, noise
│     (Optional)      │  Improve: contrast, readability
│                     │  Model: Local image processing OR Gemini Flash
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  5. PDF Generation  │  Regenerate PDF with:
│                     │  - Clean fonts (Times New Roman / Arial)
│                     │  - Proper margins
│                     │  - Clear section headers
│                     │  Tools: PDFKit, jsPDF, or Puppeteer
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  6. Side-by-Side    │  Admin preview:
│     Preview         │  [Original]  [Enhanced]
│     (Admin Only)    │  Compare quality, verify no content loss
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  7. Admin Approval  │  Decision: approve / reject / regenerate
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  8. Publish         │  Enhanced PDF → storage/derived/ai-pdfs/
│                     │  Status: approved
│                     │  Link to original in metadata
└─────────────────────┘
```

### Enhancement Types

**Type 1: OCR-Based (For Scanned Papers)**
- Extract text via Tesseract.js
- Reconstruct layout
- Generate clean PDF with searchable text

**Type 2: Layout-Based (For Born-Digital Papers)**
- Normalize fonts and spacing
- Improve contrast and margins
- Fix formatting inconsistencies

**Type 3: AI-Assisted (Optional)**
- Use Gemini Flash or local model
- Remove artifacts and noise
- Enhance readability without changing content

### Approval Criteria

Admin must verify:
- ✅ No content changes (questions identical)
- ✅ No missing information
- ✅ Improved readability
- ✅ Printable quality
- ✅ File size reasonable (< 5MB per paper)

### Output Metadata

```json
{
  "original_pdf": "papers/assam-university/fyug/physics/AU-FYUG-PHYDSC101T-2023.pdf",
  "enhanced_pdf": "storage/derived/ai-pdfs/PHYDSC101T-2023-enhanced.pdf",
  "enhancement_type": "ocr-based",
  "processed_at": "2026-01-30T10:00:00Z",
  "approved_by": "admin@example.com",
  "approved_at": "2026-01-30T11:00:00Z",
  "file_size_original": "12.4 MB",
  "file_size_enhanced": "2.1 MB"
}
```

---

## Pipeline Architecture: RAW → Repeated Questions

### Goal

Automatically detect **repeated questions across years** from question paper PDFs, with semantic matching and admin verification.

### Pipeline Stages

```
┌─────────────────────────┐
│  1. Input Collection    │  Gather: All papers for same paper code
│                         │  Example: PHYDSC102T (2020-2024)
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  2. OCR + Layout Parse  │  Extract text with position info
│                         │  Detect: units, sections, questions, OR markers
│                         │  Tools: PDF.js, Tesseract.js
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  3. Pattern Detection   │  Identify:
│                         │  - Unit headers: "UNIT I", "Unit-1", "UNIT 1"
│                         │  - Sections: "Section A", "Section-B"
│                         │  - Questions: "1.", "Q1", "(i)"
│                         │  - OR questions: "OR", "or", "/"
│                         │  - Years: "2023", "2022-23"
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  4. Semantic Matching   │  Compare questions across years
│                         │  Tools: Sentence embeddings
│                         │  - Gemini Text Embedding (free)
│                         │  - OR: Sentence Transformers (local)
│                         │  Similarity threshold: 85%+
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  5. Schema Mapping      │  Map to RQ-v1.1 schema:
│                         │  - meta, sections, units, questions/choices
│                         │  Preserve: original numbering, marks, years
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  6. Validation          │  Check:
│                         │  - Schema compliance
│                         │  - Numbering consistency
│                         │  - Unit coverage
│                         │  - Marks accuracy
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  7. Draft RQ JSON       │  Save to: admin/review-queues/rq.json
│                         │  Status: draft
│                         │  Include: confidence scores
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  8. Admin Verification  │  Review:
│     (Mandatory)         │  - Repeated questions correct
│                         │  - Units mapped properly
│                         │  - No false positives
│                         │  - Marks are accurate
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  9. Publish RQ JSON     │  Approved → data/repeated-questions/...
│                         │  Status: published
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  10. Optional RQ PDF    │  Generate visual RQ PDF (future)
│      Generation         │  Display repeated questions formatted
│                         │  Requires separate admin approval
└─────────────────────────┘
```

### Semantic Matching Strategy

**Challenge**: Questions may have slightly different wording across years.

**Solution**: Use semantic embeddings to find similar questions.

**Example**:
```
Year 2023: "Explain Newton's laws of motion."
Year 2022: "Describe Newton's three laws of motion with examples."
Similarity: 87% → MATCH ✓
```

**Tools**:
- **Gemini Text Embedding API** (free, 2000+ req/min)
- **Sentence Transformers** (local, no API needed)
- **OpenAI Embeddings** (backup, free tier available)

**Implementation** (pseudo-code):
```javascript
// Get embeddings for all questions
const embeddings = await Promise.all(
  questions.map(q => getEmbedding(q.text))
);

// Compare pairwise
for (let i = 0; i < questions.length; i++) {
  for (let j = i + 1; j < questions.length; j++) {
    const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
    if (similarity > 0.85) {
      markAsRepeated(questions[i], questions[j]);
    }
  }
}
```

### OR Question Handling

**Detection**: Look for markers like "OR", "or", "/", "EITHER ... OR"

**Representation** (in schema):
```json
{
  "section_id": "B",
  "units": [
    {
      "unit_no": 1,
      "choices": [
        {
          "choice_id": "1a",
          "years": [2023, 2022],
          "parts": [
            {"label": "a", "text": "Question part a", "marks": 5},
            {"label": "b", "text": "Question part b", "marks": 5}
          ]
        },
        {
          "choice_id": "1b",
          "years": [2023],
          "parts": [
            {"label": "a", "text": "OR Question part a", "marks": 5},
            {"label": "b", "text": "OR Question part b", "marks": 5}
          ]
        }
      ]
    }
  ]
}
```

### Admin Verification Checklist

- [ ] All units present and correctly numbered
- [ ] Repeated questions are genuinely similar
- [ ] No false positives (non-repeated marked as repeated)
- [ ] Marks are accurate
- [ ] Years are correct
- [ ] OR questions handled properly
- [ ] Schema compliance verified

---

## Notes System Architecture

### Goal

Enable **human-generated and AI-assisted study notes** with clear source labeling and access control.

### Note Types

**1. Human-Generated Notes**
- Written by contributors
- Reviewed by moderators
- Full attribution

**2. AI-Assisted Notes**
- Generated by AI (Gemini Flash, local LLM)
- Heavily reviewed by humans
- Clearly labeled as "AI-assisted"

**3. Hybrid Notes**
- AI draft + human editing
- Best of both worlds

### Access Levels

| Level | Description | Unlocked By |
|-------|-------------|-------------|
| **Public** | Free for everyone | N/A |
| **Logged-in** | Preview + basic notes | Creating account |
| **Contributor** | Own notes + featured | Uploading papers, improving data |
| **Premium** | All notes + references | Small contribution or donation |

### Content Structure

```json
{
  "note_id": "n-abc123",
  "paper_code": "PHYDSC101T",
  "title": "Unit 1 Summary: Vector Algebra",
  "type": "human-generated",
  "author": {
    "id": "user123",
    "display_name": "Arjun Das",
    "badges": ["Verified Contributor", "Subject Expert"]
  },
  "access_level": "public",
  "status": "approved",
  "created_at": "2026-01-15T10:00:00Z",
  "approved_by": "admin@example.com",
  "approved_at": "2026-01-20T08:00:00Z",
  "content": {
    "format": "markdown",
    "path": "storage/derived/notes/public/PHYDSC101T-unit1.md"
  },
  "metadata": {
    "unit": 1,
    "topics": ["vectors", "matrices"],
    "difficulty": "medium",
    "length_pages": 5
  }
}
```

### AI-Assisted Note Generation (Future)

**Workflow**:
```
1. User selects: paper code + unit
2. AI generates: summary from syllabus + question papers
3. Status: draft (never auto-published)
4. Admin reviews: accuracy, clarity, completeness
5. If approved: publish with "AI-assisted" label
```

**Safety**:
- All AI notes labeled clearly
- Never claim human authorship
- Admin verifies academic accuracy
- Fallback to manual if AI unavailable

### Unlock Model (Ethical)

**Philosophy**: Knowledge should be accessible, but sustainability matters.

**Unlock Options**:
1. **Contribution** (Recommended)
   - Upload 5+ question papers → 6 months premium
   - Fix 10+ data errors → 3 months premium
   - Write 1 verified note → 3 months premium

2. **Donation** (Optional)
   - ₹99 → 3 months premium
   - ₹299 → 12 months premium
   - **No pressure, completely voluntary**

3. **Community Participation**
   - Help other students in forums → Premium rewards
   - Build reputation over time

**No Subscription Pressure**:
- ❌ No recurring charges
- ❌ No aggressive upsells
- ❌ No student-hostile tactics
- ✅ Ethical access always

---

## Admin Review Workflow

### Workflow States

All content follows this lifecycle:

```
draft → needs_review → [approved | rejected] → published
```

**draft**: Initial state after generation/upload  
**needs_review**: Flagged for admin attention  
**approved**: Admin verified, ready to publish  
**rejected**: Admin declined, not published  
**published**: Live on site, visible to users

### Review Queues

Admin dashboard shows pending reviews by type:

```
┌─────────────────────────────────────┐
│  Admin Review Dashboard             │
├─────────────────────────────────────┤
│  Browse Cards: 5 pending            │
│  Syllabus: 2 pending                │
│  Repeated Questions: 3 pending      │
│  AI-Enhanced PDFs: 1 pending        │
│  Notes: 7 pending                   │
└─────────────────────────────────────┘
```

**Stored in**: `/admin/review-queues/{type}.json`

### Review Metadata

Each review item includes:

```json
{
  "id": "review-abc123",
  "type": "syllabus",
  "status": "needs_review",
  "created_at": "2026-01-30T08:00:00Z",
  "submitted_by": "user@example.com",
  "assigned_to": "admin@example.com",
  "priority": "normal",
  "confidence_score": 85,
  "review_notes": "",
  "history": [
    {
      "action": "submitted",
      "by": "user@example.com",
      "at": "2026-01-30T08:00:00Z"
    }
  ]
}
```

### Admin Actions

**Approve**:
- Move content from draft to production
- Update status to "published"
- Notify contributor
- Add to public site

**Reject**:
- Add rejection reason
- Notify contributor with feedback
- Archive draft (don't publish)

**Request Changes**:
- Flag specific issues
- Send back to contributor
- Status → "revisions_requested"

**Audit Trail**: All actions logged with who, what, when.

---

## Roles, Badges & Trust Model

### Roles (Future Supabase Integration)

| Role | Description | Permissions |
|------|-------------|-------------|
| **Guest** | Not logged in | View papers, syllabus, RQ |
| **User** | Logged in | Upload papers, request notes |
| **Contributor** | Active user | Submit notes, earn premium access |
| **Moderator** | Trusted contributor | Review notes, edit metadata |
| **Admin** | Full access | Approve all content, manage users |
| **AI Reviewer** | Specialized role | Review AI-generated content |

### Badge System

Badges appear on:
- User profiles
- Comment sections
- Approval logs
- Contributor dashboards

#### Badge Types

**Contribution Badges**:
- 📄 **Paper Uploader** - Uploaded 5+ verified papers
- 📝 **Note Author** - Wrote 3+ approved notes
- 🔍 **Data Fixer** - Fixed 10+ data errors

**Subject Expertise Badges**:
- 🧪 **Physics Expert** - Verified expertise in Physics
- 💼 **Commerce Expert** - Verified expertise in Commerce
- 🧬 **Chemistry Expert** - Verified expertise in Chemistry

**Review Badges**:
- ✅ **RQ Validator** - Reviewed 10+ RQ submissions
- 📘 **Syllabus Reviewer** - Reviewed 10+ syllabus extractions

**Trust Badges**:
- ⭐ **Verified Contributor** - Admin-verified identity
- 🏆 **Top Contributor** - Exceptional contributions
- 🛡️ **Trusted Reviewer** - Consistently accurate reviews

### Earning Badges

**Automatic**:
- Contribution count badges (Paper Uploader, Note Author)
- Review count badges (RQ Validator, Syllabus Reviewer)

**Manual (Admin-Granted)**:
- Subject Expert badges (requires verification)
- Verified Contributor (identity check)
- Top Contributor (exceptional work)

### Trust Score

Each user has a trust score (0-100) based on:
- Contribution accuracy
- Review accuracy
- Community reputation
- Time active

**High Trust (80-100)**: Fast-track review, auto-approve minor edits  
**Medium Trust (50-79)**: Standard review process  
**Low Trust (0-49)**: Enhanced scrutiny, manual review

---

## AI Safety & Model-Agnostic Design

### Core Principle

> **No student should be blocked from contributing or learning because they can't afford paid AI APIs.**

### Allowed AI Models

**Open-Source Models** (Preferred):
- ✅ LLaMA 3 (Meta, Apache 2.0)
- ✅ Mistral (Apache 2.0)
- ✅ Gemma (Google, Apache 2.0)
- ✅ Phi-3 (Microsoft, MIT)

**Free-Tier Commercial APIs**:
- ✅ Gemini Flash (Google, free with generous limits)
- ✅ Claude Haiku (Anthropic, free tier available)
- ✅ GPT-3.5 Turbo (OpenAI, free tier available)

**Local Deployment**:
- ✅ Ollama (run LLMs locally)
- ✅ llama.cpp (run LLMs locally)
- ✅ vLLM (run LLMs locally)

### Prohibited Dependencies

❌ **Paid-only APIs without free alternative**
❌ **Closed-source models with usage limits**
❌ **APIs requiring credit cards for students**

### Model-Agnostic Architecture

**Configuration-Based Selection**:

```javascript
// ai/config.json
{
  "models": {
    "syllabus_extraction": {
      "primary": "gemini-flash",
      "fallback": "ollama-llama3",
      "local": "llama3-8b"
    },
    "rq_matching": {
      "primary": "gemini-embedding",
      "fallback": "sentence-transformers",
      "local": "all-MiniLM-L6-v2"
    }
  }
}
```

**Prompt Templates** (separate from code):

```
# ai/prompts/syllabus-extraction.txt

You are a syllabus extraction assistant. Extract structured data from the following syllabus text.

Follow this JSON schema exactly:
{schema_here}

Syllabus text:
{syllabus_text}

Return valid JSON only. No explanations.
```

**Validation** (schema-driven):

```javascript
// Always validate AI output against schema
const result = await aiModel.generate(prompt);
const validated = validateAgainstSchema(result, 'syllabus.schema.json');

if (!validated.valid) {
  // Fallback to manual process
  console.log('AI output invalid, flagging for manual review');
}
```

### Fallback Strategy

If AI is unavailable or produces low-quality output:

```
AI Fails → Manual Process
├─ Flag for human data entry
├─ Use existing manual workflows
└─ Never block user progress
```

**Rule**: AI is an **assistant**, not a **requirement**.

---

## File Cleanup & Legacy Removal

### Files to Remove

**1. data/papers-legacy.txt**

**Reason**: Obsolete format superseded by `data/papers.json` and `maps/` system.

**Justification**:
- Current paper registry uses JSON format
- Legacy text format not consumed by any active feature
- No migration path needed (already migrated)
- Safe to remove

**Impact**: None (no active feature references this file)

### Files to Keep (Justification)

**1. demo/ directory**

**Reason**: Useful for testing PDF rendering and UI components.

**Justification**:
- Contains `pdf-demo.html` for testing PDF display
- Small size (< 10 KB)
- May be useful for future development
- No harm in keeping

**Decision**: Keep demo/ for now

**2. templates/ directory**

**Reason**: Contains `syllabus.html` template for future use.

**Justification**:
- May be used for future syllabus PDF generation
- Small size
- Planning artifact

**Decision**: Keep templates/ as it aligns with architecture planning

### Files to Monitor

**node_modules/**:
- ✅ Already in .gitignore
- ✅ Not committed to repository
- ✅ No cleanup needed

**papers/ directory**:
- ✅ Contains active PDFs
- ✅ Do not remove
- ✅ May reorganize in future per `/storage/raw/` design

---

## Implementation Roadmap

### Phase 7 (Current - Planning Only) ✅

**Deliverables**:
- [x] This architecture document
- [ ] Create empty folder structure with README files
- [ ] Remove legacy file (data/papers-legacy.txt)
- [ ] Update main README with Phase 7 reference

**Timeline**: Immediate (documentation only)

### Phase 8 (Foundation) 🔜

**Focus**: Infrastructure setup

**Tasks**:
- [ ] Set up Supabase Storage (PDFs)
- [ ] Implement authentication (Supabase Auth)
- [ ] Create admin dashboard (basic)
- [ ] Build upload interface (browse card draft submission)

**Timeline**: 2-4 weeks

### Phase 9 (Syllabus Automation) 📅

**Focus**: Automated syllabus extraction

**Tasks**:
- [ ] Implement OCR pipeline (Tesseract.js)
- [ ] Integrate AI extraction (Gemini Flash)
- [ ] Build schema validation
- [ ] Create admin review UI for syllabus
- [ ] Test with 5-10 syllabus PDFs

**Timeline**: 4-6 weeks

### Phase 10 (RQ Automation) 📅

**Focus**: Repeated questions detection

**Tasks**:
- [ ] Build question detection (pattern matching)
- [ ] Implement semantic matching (embeddings)
- [ ] Map to RQ schema
- [ ] Create admin review UI for RQ
- [ ] Test with 10+ paper codes

**Timeline**: 6-8 weeks

### Phase 11 (Notes System) 📅

**Focus**: Human and AI-assisted notes

**Tasks**:
- [ ] Build note submission workflow
- [ ] Implement access control
- [ ] Create contributor dashboard
- [ ] Add unlock mechanisms (contribution/donation)
- [ ] Build AI-assisted note generation (optional)

**Timeline**: 6-8 weeks

### Phase 12 (AI-Enhanced PDFs) 📅

**Focus**: Clean, normalized PDFs

**Tasks**:
- [ ] OCR pipeline for scanned papers
- [ ] Layout normalization
- [ ] PDF regeneration (PDFKit/Puppeteer)
- [ ] Side-by-side preview for admin
- [ ] Batch processing

**Timeline**: 4-6 weeks

### Phase 13 (Polish & Scale) 📅

**Focus**: Production readiness

**Tasks**:
- [ ] Performance optimization
- [ ] Mobile app (optional)
- [ ] Multi-university support
- [ ] API for third-party integrations
- [ ] Analytics dashboard

**Timeline**: Ongoing

---

## Success Criteria

Phase 7 is complete when:

### Documentation ✅
- [x] `docs/PHASE7_ARCHITECTURE.md` created and comprehensive
- [ ] Clear "What Changes" vs "What Does Not Change" section
- [ ] All pipelines designed (no implementation)
- [ ] Admin workflow documented
- [ ] Roles and badges model defined

### Folder Structure ✅
- [ ] `/storage/`, `/ai/`, `/admin/` folders created (with README)
- [ ] Empty folders justified with future purpose
- [ ] No actual implementation in new folders

### Legacy Cleanup ✅
- [ ] `data/papers-legacy.txt` removed
- [ ] Justification documented for removal
- [ ] No active features broken

### Architecture Quality ✅
- [x] AI usage is safe, optional, and replaceable
- [x] Admin control is central to all pipelines
- [x] Phase 4-6 decisions fully respected
- [x] No schema changes proposed
- [x] No code implementation attempted

### Verification ✅
- [ ] All existing pages still work (browse.html, paper.html, etc.)
- [ ] No functionality regression
- [ ] Repository structure cleaner than before
- [ ] Clear path forward for implementation

---

## Conclusion

Phase 7 establishes a **production-ready architectural blueprint** for ExamArchive-v2's evolution into an AI-powered, admin-controlled, student-first academic platform.

### Key Achievements

✅ **Clear Separation**: RAW (immutable) vs DERIVED (reproducible)  
✅ **Admin Control**: Mandatory approval for all public content  
✅ **AI Safety**: Only open-source or free student-accessible models  
✅ **Model-Agnostic**: Configuration-based, prompt-driven, schema-validated  
✅ **Trust System**: Roles, badges, and contributor validation  
✅ **Ethical Access**: Knowledge-first, contribution-driven, no aggressive monetization

### Alignment

✅ Respects all Phase 4 architectural decisions  
✅ Builds upon Phase 6 pipeline designs  
✅ Maintains Phase 5 UI consistency standards  
✅ Preserves all existing schemas (LOCKED)  
✅ No functionality regression

### Next Steps

**Immediate** (Phase 8):
- Infrastructure setup (Supabase Storage + Auth)
- Basic admin dashboard
- Upload interface

**Near-term** (Phase 9-10):
- Syllabus automation
- RQ automation

**Long-term** (Phase 11-13):
- Notes system
- AI-enhanced PDFs
- Production scaling

---

**Document Status**: ✅ Complete  
**Implementation Status**: Not Started (As Intended)  
**Review Status**: Pending Stakeholder Approval

---

**Prepared by**: GitHub Copilot Agent  
**Date**: 2026-01-30  
**Phase**: 7 (Planning Only)
