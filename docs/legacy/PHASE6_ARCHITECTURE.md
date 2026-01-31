# Phase 6 — Storage, Pipeline & Remaining Phase-5 Fixes

**Document Version**: 1.0  
**Date**: 2026-01-30  
**Status**: 📋 Architecture Planning Only

> ⚠️ **IMPORTANT**  
> This phase is **planning and documentation only**.  
> **NO code changes, NO implementation, NO file migrations** in this phase.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 5 Status Summary](#phase-5-status-summary)
3. [PDF Storage Strategy](#61-pdf-storage-strategy)
4. [Syllabus Pipeline Design](#62-syllabus-pipeline-design)
5. [Repeated Questions Automation](#63-repeated-questions-automation)
6. [Notes & References System](#64-notes--references-system)
7. [Browse Page Redesign](#65-browse-page-redesign)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

Phase 6 builds upon the architectural foundation established in Phase 4 (see `PHASE4_ARCHITECTURE.md`). This document focuses on:

1. **PDF Storage Strategy** - Where and how to store academic content
2. **Automation Pipelines** - Syllabus and RQ extraction workflows
3. **Premium Content System** - Notes and references access model
4. **UI/UX Enhancements** - Browse and paper page redesign

**Key Principle**: Separate raw academic sources from derived/generated content, with clear automation boundaries and human review processes.

---

## Phase 5 Status Summary

### Completed ✅

1. **Red Classic Theme**
   - Fixed light mode: red + white background
   - Fixed dark mode: deep red + dark neutral colors
   - Fixed AMOLED mode: pure black + red accent
   - All theme presets now properly support light/dark/AMOLED modes

2. **Font System**
   - Expanded to 6 font options:
     - Archive Default (System)
     - System Default
     - Academic Serif (Crimson Pro)
     - Clean Sans (Inter)
     - Reading Sans (Source Sans 3)
     - Monospace (Code)
   - Added Google Fonts integration
   - Real-time preview working
   - Apply/Reset buttons functional

### Remaining Tasks

1. **Accent Color Override**
   - Button colors currently use `var(--accent)` correctly
   - Need to verify consistency across all button variants
   - Focus rings should use accent color

2. **Theme Toggle Consistency**
   - Dark/AMOLED toggles already affect entire page via CSS variables
   - Header icons use `currentColor` - working as intended

---

## 6.1 PDF Storage Strategy

### Storage Architecture

The PDF storage system uses a **tiered approach** separating raw authoritative sources from derived/generated content.

### Storage Tiers

#### Tier 1: Raw Academic Sources (Authoritative)

**Purpose**: Preserve original academic documents exactly as issued

**Content Types**:
- Original question papers (as issued by university)
- Original syllabus PDFs or scanned images
- Official notices and circulars
- Scanned documents

**Recommended Storage Options**:

| Option | Use Case | Pros | Cons | Cost |
|--------|----------|------|------|------|
| **GitHub LFS** | Short term (< 1GB) | Version control, integrated workflow | Size limits, Git not designed for binaries | Free (1GB) |
| **Supabase Storage** | Mid to long term | CDN, auth integration, designed for files | Requires Supabase setup | Free (1GB), then paid |
| **Cloudflare R2** | Long term production | No egress fees, S3-compatible | Setup complexity | Free (10GB), $0.015/GB after |
| **GitHub Pages + CDN** | Static hosting | Simple, free, fast | No authentication | Free |

**Recommended Approach**: 
- **Phase 1**: GitHub repository for immediate needs (< 100MB total)
- **Phase 2**: Migrate to Supabase Storage (integrated with existing Supabase auth)
- **Phase 3**: Consider Cloudflare R2 if scale demands (cost-effective for large files)

#### Directory Structure (Raw Assets)

```
storage/
├── raw/
│   ├── papers/
│   │   ├── assam-university/
│   │   │   ├── physics/
│   │   │   │   ├── fyug/
│   │   │   │   │   ├── 2023-PHYDSC101T.pdf
│   │   │   │   │   ├── 2022-PHYDSC101T.pdf
│   │   │   │   │   └── 2021-PHYDSC101T.pdf
│   │   │   │   └── cbcs/
│   │   │   ├── chemistry/
│   │   │   └── mathematics/
│   │   └── [other-universities]/
│   ├── syllabus/
│   │   ├── assam-university/
│   │   │   ├── fyug/
│   │   │   │   ├── PHYDSC101T.pdf
│   │   │   │   └── CHMDSC101T.pdf
│   │   │   └── cbcs/
│   │   └── [other-universities]/
│   └── references/
│       └── textbooks/
└── derived/
    └── (see below)
```

**Key Characteristics**:
- Immutable: Never modify original files
- Versioned: Multiple versions if corrections occur
- Organized: Mirror academic structure (university → subject → programme)

#### Tier 2: Derived/Generated Content

**Purpose**: Store processed, cleaned, and AI-enhanced content

**Content Types**:
- Syllabus JSON (extracted from PDFs)
- Repeated Questions JSON (extracted from papers)
- AI-generated clean PDFs (enhanced readability)
- Notes and study materials
- Analytics and metadata

**Storage Location**: Repository `data/` directory (version controlled)

#### Directory Structure (Derived Content)

```
data/
├── syllabus/
│   ├── assam-university/
│   │   ├── fyug/
│   │   │   └── PHYDSC101T.json
│   │   └── cbcs/
│   └── [other-universities]/
├── repeated-questions/
│   ├── assam-university/
│   │   ├── fyug/
│   │   │   └── PHYDSC102T.json
│   │   └── cbcs/
│   └── [other-universities]/
├── notes/
│   ├── public/
│   │   └── PHYDSC101T/
│   │       ├── index.json
│   │       └── unit-1-summary.pdf
│   └── premium/
│       └── PHYDSC101T/
│           └── complete-guide.pdf
└── analytics/
    └── metadata.json
```

**Key Characteristics**:
- Reproducible: Can be regenerated from raw sources
- Version controlled: Track changes via Git
- Never manually edited: Once automation exists, regenerate instead

### Naming Conventions

**Files**:
- Question papers: `{year}-{paperCode}.pdf` (e.g., `2023-PHYDSC101T.pdf`)
- Syllabus: `{paperCode}.pdf` (e.g., `PHYDSC101T.pdf`)
- JSON: `{paperCode}.json`

**Folders**:
- University: lowercase, hyphenated (e.g., `assam-university`)
- Subject: lowercase (e.g., `physics`, `chemistry`)
- Programme: uppercase abbreviation (e.g., `fyug`, `cbcs`)

### CDN & Hosting Recommendations

#### Free Options (Recommended)

1. **Supabase Storage**
   - **Free Tier**: 1GB storage
   - **Features**: Authentication, CDN, direct browser upload
   - **Best For**: Integrated solution with existing Supabase auth
   - **Setup**: Already using Supabase, minimal additional config

2. **Cloudflare R2**
   - **Free Tier**: 10GB storage, unlimited egress
   - **Features**: S3-compatible API, no bandwidth charges
   - **Best For**: Cost-effective scaling
   - **Setup**: Requires account, S3-compatible client

3. **GitHub Pages + jsDelivr CDN**
   - **Free Tier**: Unlimited (within GitHub limits)
   - **Features**: Version control, automatic CDN
   - **Best For**: Static, public content
   - **Setup**: Already using GitHub

#### Implementation Strategy

**Phase 1** (Immediate): Use GitHub repository for PDFs
- Store PDFs directly in `/papers` directory
- Serve via GitHub Pages or jsDelivr CDN
- Works for small scale (< 100MB)

**Phase 2** (Within 3 months): Migrate to Supabase Storage
- Configure Supabase Storage bucket
- Upload PDFs to Supabase
- Update paper metadata to reference Supabase URLs
- Benefits: Authentication, better file management

**Phase 3** (If needed): Scale to Cloudflare R2
- Only if storage exceeds 1GB or costs become issue
- Migrate from Supabase to R2
- Update URL references in metadata

---

## 6.2 Syllabus Pipeline Design

### Goal

Automatically convert **PDF/Image syllabus → structured JSON** with minimal manual intervention.

### Pipeline Architecture

```
┌─────────────────────┐
│   Upload PDF/Image  │
│   (Admin Interface) │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  OCR (if needed)    │
│  Tesseract / Cloud  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Text Extraction &   │
│   Normalization     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  AI Extraction      │
│  (GPT-4 / Claude)   │
│  Schema-guided      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Schema Validation   │
│   (JSON Schema)     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Human Review       │
│   (Admin UI)        │
│  Approve/Correct    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Publish JSON +    │
│   Link to Source    │
└─────────────────────┘
```

### Pipeline Stages

#### Stage 1: Upload & Preprocessing

**Input**: PDF or scanned image of syllabus  
**Process**:
- Validate file format and size
- Store in raw storage tier
- Detect if OCR is needed (PDF vs image)

**Tools**:
- Frontend: HTML5 File API with drag-drop
- Backend: Supabase Storage or GitHub API
- Validation: Check file type, size limits

#### Stage 2: OCR Processing (If Needed)

**When**: Only for scanned images or image-based PDFs  
**Process**:
- Extract text using OCR engine
- Preserve layout information
- Handle multiple languages if needed

**Tool Options**:
1. **Tesseract.js** (Free, client-side)
   - Pros: No server needed, privacy-friendly
   - Cons: Slower, less accurate
   
2. **Google Cloud Vision** (Free tier: 1000 units/month)
   - Pros: High accuracy, fast
   - Cons: Requires API key, privacy concerns

3. **AWS Textract** (Free tier: 1000 pages/month)
   - Pros: Layout understanding, tables
   - Cons: AWS setup required

**Recommended**: Start with Tesseract.js, upgrade to Cloud Vision if needed

#### Stage 3: Text Extraction & Normalization

**Process**:
- Extract text from PDF using PDF.js or similar
- Normalize spacing, line breaks
- Fix common OCR errors (if applicable)
- Detect structure (headings, units, topics)

**Tools**:
- **PDF.js**: Client-side PDF text extraction
- **String normalization**: Regex patterns for cleanup

#### Stage 4: AI Extraction

**Process**:
- Send normalized text to AI model
- Provide JSON schema as part of prompt
- Request structured extraction
- Validate AI response

**AI Model Options**:
1. **GPT-4** (OpenAI)
   - Pros: Excellent understanding, JSON mode
   - Cons: Cost ($0.01-0.03 per 1K tokens)

2. **Claude 3** (Anthropic)
   - Pros: Long context, good reasoning
   - Cons: Cost, API access

3. **Open Source** (Llama 3, etc.)
   - Pros: Free, self-hosted
   - Cons: Setup complexity, lower accuracy

**Recommended**: GPT-4 Turbo with JSON mode

**Prompt Template**:
```
You are a syllabus extraction assistant. Extract the following information from the university syllabus and return it in JSON format matching this schema:

{schema}

Syllabus Text:
{text}

Return ONLY valid JSON matching the schema. Ensure:
- All units are numbered sequentially
- Topics are extracted completely
- Credit hours are included if present
- References are formatted consistently
```

#### Stage 5: Schema Validation

**Process**:
- Validate AI output against JSON schema
- Check required fields
- Verify data types
- Ensure completeness

**Tools**:
- **AJV** (JavaScript): Fast JSON schema validator
- **JSON Schema**: Use existing schema from `docs/schema/`

**Validation Rules**:
- All required fields must be present
- Unit numbers must be sequential
- Topics must be non-empty arrays
- Credit hours must be positive numbers

#### Stage 6: Human Review & Approval

**Process**:
- Display extracted syllabus in admin UI
- Highlight any uncertain extractions
- Allow corrections inline
- Approve or reject for publication

**UI Features**:
- Side-by-side: Original PDF vs extracted JSON
- Edit mode: Inline editing of fields
- Diff view: Changes from original extraction
- Approval workflow: Submit → Review → Publish

**Admin Actions**:
- **Approve**: Publish to production
- **Edit & Approve**: Make corrections, then publish
- **Reject**: Send back for re-extraction
- **Flag for manual entry**: Mark as too complex for AI

#### Stage 7: Publication

**Process**:
- Save validated JSON to `data/syllabus/`
- Link to source PDF in metadata
- Update paper metadata to reference syllabus
- Deploy to production

**Output**:
```json
{
  "code": "PHYDSC101T",
  "title": "Mechanics and Properties of Matter",
  "credits": 4,
  "objectives": [...],
  "units": [
    {
      "number": 1,
      "title": "Statics",
      "topics": [...],
      "hours": 15
    }
  ],
  "outcomes": [...],
  "references": [...],
  "metadata": {
    "sourcePdf": "raw/syllabus/fyug/PHYDSC101T.pdf",
    "extractedDate": "2026-01-30",
    "extractionMethod": "gpt-4-turbo",
    "reviewedBy": "admin",
    "version": "1.0"
  }
}
```

### Schema Evolution

**Principle**: Schema is **versioned and stable**. AI adapts to schema, not vice versa.

**When schema changes**:
1. Version bump (e.g., v1.0 → v1.1)
2. Migration script for existing data
3. Update AI prompts to match new schema
4. Re-extract or migrate old syllabi

### Fallback: Manual Entry

**When automation fails**:
- Complex layouts (tables, diagrams)
- Multiple languages
- Poor scan quality
- Non-standard format

**Manual entry workflow**:
1. Admin selects "Manual Entry" option
2. Form with schema-based fields
3. Fill in syllabus data manually
4. Save as JSON
5. Link to source PDF

---

## 6.3 Repeated Questions (RQ) Automation

### Goal

Auto-generate RQ JSON from multiple years of question paper PDFs.

### Pipeline Architecture

```
┌─────────────────────────┐
│ Input: Multiple Years   │
│ of Question Paper PDFs  │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  OCR + Layout Parsing   │
│  Extract Questions      │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Pattern Detection:     │
│  - Units                │
│  - Sections             │
│  - Question Numbers     │
│  - Years                │
│  - OR Questions         │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Semantic Matching      │
│  Find Repeated Qs       │
│  Across Years           │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Map to RQ Schema       │
│  Organize by Unit       │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Validate Structure     │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Human Review           │
│  Verify Matches         │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Publish RQ JSON        │
└─────────────────────────┘
```

### Key Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Question wording varies slightly | Use semantic embeddings (OpenAI/Sentence Transformers) |
| Unit numbering inconsistent | Multi-pattern recognition (UNIT I, Unit-1, etc.) |
| OCR errors | Post-process with spell check, context validation |
| OR questions | Detect markers ("OR", "or", "/"), treat as alternatives |
| Section variations | Normalize section names (A/a/Section-A → A) |

### Pattern Detection

**Unit Headers**:
- Regex patterns: `UNIT[- ]?[IVX]+`, `Unit[- ]?\d+`, etc.
- Position-based: Large font, centered, uppercase

**Sections**:
- Regex: `Section[- ]?[A-Z]`, `SECTION[- ]?[A-Z]`
- Alternative: `Part [A-Z]`, `GROUP [A-Z]`

**Question Numbers**:
- Simple: `\d+\.`, `Q\d+`, `\(\d+\)`
- Sub-questions: `\d+\.[a-z]\)`, `\([a-z]\)`, `\(i\)`

**Years**:
- Detect from filename or header
- Regex: `20\d{2}`, `\d{4}`

### Semantic Matching

**Goal**: Identify identical or near-identical questions across years

**Approach**:
1. **Extract question text** (without numbers/markers)
2. **Generate embeddings** using OpenAI or local model
3. **Calculate similarity** (cosine similarity)
4. **Threshold**: > 0.85 = likely match
5. **Human verification** of matches

**Tools**:
- **OpenAI Embeddings API**: $0.0001 per 1K tokens (cheap)
- **Sentence Transformers** (Free): Local, open-source
- **Cosine Similarity**: Standard similarity metric

### Schema Mapping

**Output Format** (existing RQ schema):
```json
{
  "code": "PHYDSC102T",
  "units": [
    {
      "unit": 1,
      "years": [
        {
          "year": 2023,
          "sections": [
            {
              "section": "A",
              "questions": ["1", "2", "3"]
            },
            {
              "section": "B",
              "questions": ["4a", "5b"]
            }
          ]
        },
        {
          "year": 2022,
          "sections": [
            {
              "section": "A",
              "questions": ["1", "3"]
            }
          ]
        }
      ]
    }
  ]
}
```

**Key Mapping Rules**:
- Questions grouped by unit
- Years listed chronologically
- Sections within each year
- Question numbers preserved as strings

### Human Review Step

**Critical**: RQ automation requires human verification

**Review Workflow**:
1. Admin selects papers for RQ generation
2. Pipeline runs extraction
3. Results displayed in admin UI:
   - Detected questions highlighted
   - Matched questions shown side-by-side
   - Uncertainty scores displayed
4. Admin verifies matches:
   - Approve: Mark as correct
   - Correct: Edit question mapping
   - Reject: Unlink false match
5. Admin approves for publication

**UI Features**:
- Visual diff of matched questions
- Confidence scores (e.g., 87% match)
- Bulk approve/reject for high-confidence matches
- Manual entry for missed questions

---

## 6.4 Notes & References (Future Premium System)

### Overview

Notes and references are **future premium features** that enable sustainable development while keeping core content (papers, syllabus, RQ) free.

### Access Control Model

| User Type | Status | Access | Unlock Method |
|-----------|--------|--------|---------------|
| **Guest** | Not logged in | Papers, Syllabus, RQ | - |
| **Logged-in** | Basic account | Papers, Syllabus, RQ, References preview | Sign up |
| **Contributor** | Active contributor | Own notes + Featured notes | Contribute content or help improve data |
| **Premium** | Supporter | All notes and references | Small donation or significant contribution |

### Premium Unlock Options (Ethical Access)

**Philosophy**: Knowledge should be accessible, but sustainability matters.

**Options to Unlock**:

1. **Contribution Path** (Recommended)
   - Upload 5+ quality papers
   - Improve 10+ syllabus/RQ entries
   - Help with quality review
   - Fix errors in existing data
   - **Result**: 6 months premium access

2. **Donation Path** (Optional)
   - One-time: ₹99-199 → 6 months
   - Annual: ₹299 → 1 year
   - Lifetime: ₹999 → Permanent
   - **Note**: Completely voluntary, no pressure

3. **Community Participation** (Future)
   - Active on forums (help other students)
   - Create video explanations
   - Build reputation points
   - **Result**: Premium access for active members

**Key Principles**:
- ✅ No subscription pressure or dark patterns
- ✅ No aggressive monetization
- ✅ Students come first
- ✅ Premium enables sustainability, NOT profit
- ✅ Core academic content always free

### Content Structure

**Notes Types**:
1. **Community Notes** (Free for all logged-in users)
   - User-contributed study materials
   - Moderated by admins
   - Basic quality checks

2. **Verified Notes** (Premium)
   - Reviewed by subject experts
   - High-quality, comprehensive
   - Solved examples included

3. **AI-Generated Summaries** (Premium)
   - Auto-generated from syllabus
   - Key points extraction
   - Concept explanations

**References Types**:
1. **Public References** (All users)
   - Textbook recommendations
   - Free online resources
   - YouTube lectures

2. **Premium References** (Premium users)
   - Detailed study guides
   - Practice problem sets
   - Research paper collections
   - Video lecture series

### Data Structure

```json
{
  "code": "PHYDSC101T",
  "notes": [
    {
      "id": "n001",
      "title": "Unit 1 Quick Summary",
      "type": "pdf",
      "author": "community",
      "accessLevel": "free",
      "path": "data/notes/public/PHYDSC101T/unit-1-summary.pdf",
      "verified": false
    },
    {
      "id": "n002",
      "title": "Complete Study Guide",
      "type": "pdf",
      "author": "expert-contributor",
      "accessLevel": "premium",
      "path": "data/notes/premium/PHYDSC101T/complete-guide.pdf",
      "verified": true
    }
  ],
  "references": [
    {
      "title": "Concepts of Physics Vol 1",
      "author": "H.C. Verma",
      "type": "textbook",
      "isbn": "978-8177091875",
      "relevance": "primary",
      "accessLevel": "free",
      "link": "https://..."
    },
    {
      "title": "Advanced Problem Set",
      "author": "ExamArchive Team",
      "type": "practice",
      "accessLevel": "premium",
      "path": "data/notes/premium/PHYDSC101T/problem-set.pdf"
    }
  ]
}
```

### Implementation Phases (Future)

**Phase 1**: Basic Infrastructure
- Add `accessLevel` field to content metadata
- Implement access control checks in frontend
- Create premium status tracking in Supabase

**Phase 2**: Contribution Tracking
- Track user contributions (uploads, edits)
- Award contribution points
- Auto-grant premium based on points

**Phase 3**: Payment Integration (Optional)
- Integrate Razorpay or Stripe
- Handle donations
- Update premium status

**Phase 4**: Admin Dashboard
- Review contributions
- Approve premium grants
- Manage user access

---

## 6.5 Browse Page Redesign

### Current Limitations

- Single PDF link (no distinction between original and enhanced)
- No indication of available resources (syllabus, RQ, notes)
- Limited filtering and sorting
- No preview capabilities

### Proposed Enhancements

#### Paper Card Redesign

```
┌─────────────────────────────────────────┐
│ PHYDSC101T • 2023 • Physics • FYUG      │
│ Mechanics and Properties of Matter      │
├─────────────────────────────────────────┤
│                                         │
│ 📄 Original PDF          ✨ Enhanced PDF│
│ 📘 Syllabus              🔁 RQ Analysis │
│ 🧠 Notes (Premium)                      │
│                                         │
│ [View Details]                          │
└─────────────────────────────────────────┘
```

**Visual Indicators**:
- ✅ Green checkmark: Available
- 🔒 Lock icon: Premium content
- 🚧 Processing: Being generated
- ❌ Not available: Coming soon

#### Enhanced Filtering

**Current**: Filter by subject, programme, year

**Proposed Additional Filters**:
- Papers with enhanced PDFs
- Papers with complete syllabus
- Papers with RQ analysis
- Papers with notes available
- Papers added recently (last 30 days)

**Sort Options**:
- Most recent (default)
- Most viewed
- Highest quality score
- Alphabetical (code)

#### Paper Detail Page Redesign

```
┌──────────────────────────────────────────┐
│  PHYDSC101T (2023)                       │
│  Mechanics and Properties of Matter      │
│  Physics • FYUG • Assam University       │
└──────────────────────────────────────────┘

┌─── 📄 Question Papers ───────────────────┐
│                                          │
│  ⭐ Original PDF (Official Document)     │
│  └─ Authentic university question paper  │
│  [Download Original (2.3 MB)]            │
│                                          │
│  ✨ Enhanced PDF (AI-Cleaned)            │
│  └─ Improved readability for printing    │
│  [Download Enhanced (1.8 MB)]            │
│  🚧 Processing... (ETA: 5 minutes)       │
│                                          │
└──────────────────────────────────────────┘

┌─── 📘 Syllabus ──────────────────────────┐
│                                          │
│  Complete syllabus with units, topics,   │
│  learning outcomes, and references       │
│                                          │
│  [View Complete Syllabus]                │
│  [Download Syllabus PDF]                 │
│                                          │
└──────────────────────────────────────────┘

┌─── 🔁 Repeated Questions ────────────────┐
│                                          │
│  Analysis of repeated questions across   │
│  5 years (2019-2023)                     │
│                                          │
│  Unit-wise breakdown:                    │
│  • Unit 1: 8 questions                   │
│  • Unit 2: 6 questions                   │
│  • Unit 3: 7 questions                   │
│                                          │
│  [View Detailed Analysis]                │
│                                          │
└──────────────────────────────────────────┘

┌─── 🧠 Notes & References ────────────────┐
│  🔒 Premium Content                      │
│                                          │
│  Available for premium members:          │
│  • Complete study guide (PDF)            │
│  • Solved examples (PDF)                 │
│  • Practice problems (50+ questions)     │
│  • Video explanations (10 videos)        │
│  • Reference materials                   │
│                                          │
│  [Unlock Premium Access]                 │
│  or                                      │
│  [Contribute to Unlock]                  │
│                                          │
└──────────────────────────────────────────┘
```

#### Lazy Loading Strategy

**Problem**: Loading all papers at once is slow

**Solution**: Progressive loading
1. Load first 20 papers immediately
2. Load more as user scrolls (infinite scroll)
3. Prefetch next batch in background
4. Use skeleton loaders for better UX

**Implementation**:
- Intersection Observer API for scroll detection
- Virtual scrolling for large lists
- Cache loaded data in memory

#### Mobile-First Design

**Principles**:
- Large touch targets (minimum 44x44px)
- Collapsible sections (accordion style)
- Swipe gestures for navigation
- Offline support (future via Service Workers)

---

## Implementation Roadmap

### Immediate (Next 2 Weeks)

1. ✅ Fix remaining Phase 5 issues
   - Accent color consistency verification
   - Theme toggle final testing

2. 📄 Complete Phase 6 documentation
   - This document
   - Share with stakeholders

### Short Term (1-2 Months)

**Infrastructure**:
- Set up Supabase Storage for PDFs
- Create admin upload interface
- Implement basic pipeline (PDF upload + metadata)

**UI/UX**:
- Redesign paper cards with resource indicators
- Add enhanced filtering options
- Implement lazy loading

### Mid Term (3-6 Months)

**Automation**:
- Build syllabus extraction pipeline
- Implement RQ detection pipeline
- Create admin review interface

**Premium System**:
- Add contribution tracking
- Implement basic access control
- Create unlock workflows

### Long Term (6-12 Months)

**Scaling**:
- Migrate to Cloudflare R2 if needed
- Optimize pipelines for performance
- Add multi-university support

**Advanced Features**:
- AI-generated study materials
- Video content integration
- Mobile app (React Native)

---

## Acceptance Criteria

### Phase 6 (Planning) Complete When:

- ✅ No code changes made
- ✅ No file migrations executed
- ✅ Clear PDF storage strategy documented
- ✅ Syllabus pipeline workflow defined
- ✅ RQ automation approach planned
- ✅ Premium system architecture designed
- ✅ UI/UX enhancements conceptualized
- ✅ Implementation roadmap created
- ✅ All decisions justify with pros/cons
- ✅ Free-first philosophy maintained

---

## Conclusion

Phase 6 establishes a clear roadmap for ExamArchive's evolution from a simple paper archive to a comprehensive academic platform. By planning before implementing, we ensure:

- **Scalability**: Architecture supports growth
- **Maintainability**: Clear separation of concerns
- **Sustainability**: Premium model enables long-term viability
- **User-Focus**: Students' needs come first
- **Quality**: Automated pipelines with human review

**Next Step**: Review this document with stakeholders, gather feedback, and begin implementation in subsequent phases.

---

**Document Status**: ✅ Complete  
**Implementation Status**: Not Started (As Intended)  
**Review Status**: Pending Team Feedback
