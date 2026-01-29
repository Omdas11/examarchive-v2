# Phase 4 — Repository Architecture, Automation & Content Pipeline (Design Only)

> ⚠️ **IMPORTANT**  
> This phase is **analysis + planning only**.  
> **NO file edits, NO refactors, NO migrations** in this phase.

**Document Version**: 1.0  
**Date**: 2026-01-29  
**Status**: 📋 Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#41-current-state-problem-analysis)
3. [Proposed Architecture](#42-proposed-high-level-architecture)
4. [PDF Storage Strategy](#43-where-to-store-pdfs-design-decision)
5. [Paper Structure Redesign](#44-redesigning-paper-structure-conceptual)
6. [Syllabus Automation Pipeline](#45-syllabus-pipeline-future-automation)
7. [Repeated Questions Automation](#46-repeated-questions-rq-automation)
8. [Notes & Premium System](#47-notes--references-future-premium-system)
9. [UI/UX Redesign](#48-browse--paper-page-redesign-conceptual)
10. [Automation Boundaries](#49-automation-boundaries)
11. [Repository Philosophy](#410-repository-philosophy-going-forward)
12. [Acceptance Criteria](#phase-4-acceptance-planning-only)

---

## Executive Summary

ExamArchive-v2 is evolving from a simple paper archive to a comprehensive academic platform. This document defines the **architectural vision** for supporting:

- PDFs that do not yet exist
- Automated syllabus & repeated questions extraction
- Future premium content (Notes)
- Clean separation of raw data vs generated data

**This document is planning only** — it establishes the blueprint for future development phases without making any immediate changes to the codebase.

---

## 4.1 Current State (Problem Analysis)

### Observed Issues

Our current architecture has the following characteristics and limitations:

1. **PDF References Without Files**
   - PDFs are referenced in `papers.json` but not always present in repository
   - Broken links lead to poor user experience
   - No clear strategy for PDF storage and distribution

2. **Manual Content Creation**
   - Syllabus JSON files are manually created
   - Repeated Questions JSON are manually created
   - Time-consuming and error-prone process
   - Does not scale with increased content

3. **Tight Coupling**
   - Papers, syllabus, and repeated questions are tightly coupled to UI
   - Direct file path references in code
   - Changes require code modifications

4. **Lack of Data Separation**
   - No distinction between original academic documents
   - No distinction between cleaned/generated versions
   - Mixed responsibility for data storage

5. **No Content Pipeline**
   - No defined process for uploads
   - No automated extraction workflow
   - No approval/review mechanism

### Identified Risks

Without addressing these issues, ExamArchive faces:

- **Scalability Crisis**: Manual workload will not scale with growth
- **Maintenance Burden**: Repository will become increasingly difficult to maintain
- **Feature Constraints**: Difficult to introduce premium features later
- **Quality Issues**: Manual processes lead to inconsistencies
- **Developer Friction**: Tightly coupled code is hard to modify

---

## 4.2 Proposed High-Level Architecture

### Core Principle

> **Separate RAW academic sources from DERIVED academic content**

This principle drives all architectural decisions:

- **Raw sources** = Authoritative, never auto-generated, preserved
- **Derived content** = Generated, reproducible, can be regenerated

### Architectural Layers

```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│   (HTML, CSS, JS - Consumes Data)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Content API Layer               │
│   (Resolves metadata to resources)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Automation Pipeline (Future)        │
│   (OCR, AI extraction, validation)      │
└─────────────────────────────────────────┘
                  ↓
┌──────────────────┬──────────────────────┐
│   Raw Assets     │   Derived Content    │
│  (Authoritative) │   (Generated)        │
└──────────────────┴──────────────────────┘
```

### Key Architectural Decisions

1. **Data-Driven Architecture**: UI consumes structured data, never interprets raw files
2. **Metadata Registry**: Central registry controls what exists and how to access it
3. **Asset Resolution**: UI resolves assets via metadata, not hardcoded paths
4. **Separation of Concerns**: Clear boundaries between storage, processing, and presentation

---

## 4.3 Where to Store PDFs (Design Decision)

### Storage Layers (Conceptual)

#### 1️⃣ Raw Academic Sources (Authoritative)

**Purpose**: Preserve original academic documents exactly as issued

**Content Types**:
- Original question papers (as issued by university)
- Original syllabus PDFs or scanned images
- Scanned documents
- Official notices and circulars

**Storage Location Options** (for future implementation):

**Option A: GitHub PDF-Only Repository (Short Term)**
- Pros: Version control, free, integrated with existing workflow
- Cons: Size limits (1GB per file, 100GB per repo), Git not designed for binaries
- Use Case: Immediate solution while evaluating alternatives

**Option B: Supabase Storage (Mid Term)**
- Pros: Designed for large files, CDN distribution, authentication integration
- Cons: Requires Supabase setup, potential costs at scale
- Use Case: Scalable solution once file count grows

**Option C: Hybrid Mirror (Long Term)**
- Pros: Best of both worlds, redundancy, performance
- Cons: Complexity, synchronization overhead
- Use Case: Production-ready solution for large-scale deployment

**Proposed Directory Structure** (if using filesystem):

```
raw/
 ├── papers/
 │   ├── assam-university/
 │   │   ├── physics/
 │   │   │   ├── fyug/
 │   │   │   │   ├── 2023-PHYDSC101T.pdf
 │   │   │   │   ├── 2022-PHYDSC101T.pdf
 │   │   │   │   └── 2021-PHYDSC101T.pdf
 │   │   │   └── cbcs/
 │   │   ├── chemistry/
 │   │   └── mathematics/
 ├── syllabus/
 │   ├── fyug/
 │   │   ├── PHYDSC101T.pdf
 │   │   ├── CHMDSC101T.pdf
 │   └── cbcs/
 └── references/
     └── textbooks/
```

**Key Characteristics**:
- Immutable: Never modify original files
- Versioned: Preserve multiple versions if corrections occur
- Organized: Mirror academic structure (university → subject → programme)

---

#### 2️⃣ Derived / Generated Content

**Purpose**: Store processed, cleaned, and AI-enhanced content

**Content Types**:
- Clean syllabus JSON (extracted from PDFs)
- Repeated Questions JSON (extracted from question papers)
- AI-generated clean PDFs (enhanced readability)
- Notes and study materials
- Analytics and metadata

**Proposed Directory Structure**:

```
derived/
 ├── syllabus-json/
 │   ├── assam-university/
 │   │   ├── fyug/
 │   │   │   ├── physics/
 │   │   │   │   └── PHYDSC101T.json
 ├── rq-json/
 │   ├── assam-university/
 │   │   ├── fyug/
 │   │   │   ├── physics/
 │   │   │   │   └── PHYDSC102T.json
 ├── ai-pdfs/
 │   ├── cleaned/
 │   └── annotated/
 ├── notes/
 │   ├── public/
 │   └── premium/
 └── analytics/
     └── metadata/
```

**Key Characteristics**:
- Reproducible: Can be regenerated from raw sources
- Never Manually Edited: Once automation exists, human edits not allowed
- Versioned via Generation: Track which pipeline version created them

**Critical Rule**:

> ⚠️ **Never edit derived files manually** once automation pipeline exists.  
> If errors occur, fix the source or the extraction logic, then regenerate.

---

### Storage Decision Matrix

| Aspect | Raw Assets | Derived Content |
|--------|------------|-----------------|
| **Editing** | Never (preserve original) | Via pipeline only |
| **Storage** | External (Supabase/GitHub) | Repository (data/) |
| **Versioning** | Full history | Generated, reproducible |
| **Size** | Large (PDFs) | Small (JSON) |
| **Accessibility** | Public CDN | Direct file access |
| **Backup** | Critical | Regenerable |

---

## 4.4 Redesigning Paper Structure (Conceptual)

### Current Paper Entity

Currently, a paper in `papers.json` has limited structure:

```json
{
  "id": "PHYDSC101T-2023",
  "code": "PHYDSC101T",
  "year": 2023,
  "programme": "FYUG",
  "subject": "physics",
  "pdfUrl": "/papers/..."
}
```

### Proposed Enhanced Paper Entity

Each paper should conceptually reference multiple assets:

```json
{
  "id": "PHYDSC101T-2023",
  "code": "PHYDSC101T",
  "year": 2023,
  "programme": "FYUG",
  "subject": "physics",
  "university": "assam-university",
  
  "assets": {
    "questionPaper": {
      "original": {
        "type": "pdf",
        "path": "raw/papers/assam-university/physics/fyug/2023-PHYDSC101T.pdf",
        "status": "available"
      },
      "cleaned": {
        "type": "pdf",
        "path": "derived/ai-pdfs/cleaned/2023-PHYDSC101T-clean.pdf",
        "status": "generated",
        "generatedDate": "2026-01-15"
      }
    },
    "syllabus": {
      "type": "json",
      "path": "derived/syllabus-json/assam-university/fyug/physics/PHYDSC101T.json",
      "sourcePdf": "raw/syllabus/fyug/PHYDSC101T.pdf",
      "status": "available"
    },
    "repeatedQuestions": {
      "type": "json",
      "path": "derived/rq-json/assam-university/fyug/physics/PHYDSC101T.json",
      "status": "available"
    },
    "notes": {
      "type": "json-list",
      "path": "derived/notes/PHYDSC101T/index.json",
      "status": "locked",
      "accessLevel": "premium"
    }
  },
  
  "metadata": {
    "verified": true,
    "qualityScore": 95,
    "lastUpdated": "2026-01-29"
  }
}
```

### Key Design Principles

1. **Asset References, Not Hardcoded URLs**
   - UI resolves paths via metadata
   - Easy to change storage backend
   - Supports multiple versions

2. **Status Tracking**
   - Know what exists vs. what's planned
   - Track generation state
   - Handle missing gracefully

3. **Multiple PDF Types**
   - Original = archival authenticity
   - Cleaned = readability & printing
   - Annotated = study aids (future)

4. **Access Control Metadata**
   - Some content is public
   - Some content requires authentication
   - Some content is premium

---

## 4.5 Syllabus Pipeline (Future Automation)

### Goal

Convert **PDF / Image syllabus → structured syllabus JSON** automatically

### Current Process (Manual)

```
1. Download syllabus PDF
2. Read manually
3. Type into JSON format
4. Validate structure
5. Commit to repository
```

**Problems**: Time-consuming, error-prone, doesn't scale

---

### Proposed Automated Pipeline

```
┌─────────────────┐
│  Upload PDF     │
│  or Image       │
└────────┬────────┘
         ↓
┌─────────────────┐
│  OCR Processing │  ← If image
│  (Tesseract)    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Text Extraction │
│ Normalization   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ AI Extraction   │  ← GPT-4 / Claude
│ (Schema-based)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Validation    │
│ (JSON Schema)   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Human Review    │  ← Optional
│   (Admin UI)    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Save JSON +    │
│  Link Source    │
└─────────────────┘
```

### Pipeline Components

**1. OCR Processing**
- Tool: Tesseract or Google Cloud Vision
- Input: Scanned syllabus image
- Output: Raw text

**2. Text Normalization**
- Clean formatting issues
- Fix encoding problems
- Standardize spacing

**3. AI Extraction**
- Model: GPT-4, Claude, or specialized model
- Schema: Use existing syllabus schema (`docs/schema/syllabus-schema.md`)
- Prompt: Structured extraction with validation
- Output: JSON matching schema

**4. Schema Validation**
- Validate against JSON schema
- Check required fields
- Verify data types
- Ensure completeness

**5. Human Review (Optional)**
- Admin reviews extraction
- Corrects errors
- Approves for publication
- Provides feedback to improve AI

**6. Publication**
- Save to `derived/syllabus-json/`
- Link to source PDF
- Update paper metadata
- Deploy to site

### Schema-Driven Extraction

The AI extraction **must** follow the existing syllabus schema:

```json
{
  "code": "PHYDSC101T",
  "title": "Mechanics and Properties of Matter",
  "objectives": [...],
  "units": [
    {
      "number": 1,
      "title": "...",
      "topics": [...],
      "hours": 15
    }
  ],
  "outcomes": [...],
  "references": [...]
}
```

**Key Rule**:

> Schema is **fixed and versioned**. AI adapts to schema, not vice versa.

---

### Output Characteristics

- **Single Source of Truth**: One JSON per paper code
- **Locked After Review**: Manual edits discouraged once automated
- **Linked to Source**: Always reference original PDF
- **Versioned**: Track which extraction version created it

---

## 4.6 Repeated Questions (RQ) Automation

### Goal

Generate **RQ JSON directly from question paper PDFs** automatically

### Current Process (Manual)

```
1. Read multiple years of question papers
2. Identify repeated patterns manually
3. Map to units and sections
4. Type into JSON format
5. Validate structure
```

**Problems**: Extremely time-consuming, requires subject expertise, high error rate

---

### Proposed Automated Pipeline

```
┌─────────────────────────┐
│  Input: Question Paper  │
│  PDFs (Multiple Years)  │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   OCR + Layout Parse    │
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
│  (Find Repeated Qs)     │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Map to RQ Schema       │
│  (Predefined Format)    │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Validate Numbering     │
│  & Structure            │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Save RQ JSON           │
└─────────────────────────┘
```

### Pipeline Components

**1. OCR + Layout Parsing**
- Extract text with position information
- Detect headers, sections, questions
- Identify structural elements

**2. Pattern Detection**
- Unit headers: "UNIT I", "UNIT-1", "Unit 1"
- Section markers: "Section A", "Section-B"
- Question numbers: "1.", "Q1", "(i)"
- Year identifiers: "2023", "2022-23"
- OR questions: "OR", "or", "/"

**3. Semantic Matching**
- Compare questions across years
- Use embeddings for similarity
- Account for minor wording differences
- Identify identical questions

**4. Schema Mapping**
- Map to RQ schema structure
- Organize by unit → year → section
- Format according to schema

**5. Validation**
- Check numbering sequences
- Verify unit coverage
- Ensure consistency
- Flag anomalies for review

### Schema-Driven Approach

The extraction **must** conform to the existing RQ schema (`docs/schema/repeated-questions-schema.md`):

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
            }
          ]
        }
      ]
    }
  ]
}
```

**Key Rule**:

> RQ format is **schema-driven**, not prompt-driven. The schema is the contract.

---

### Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Question wording varies slightly | Use semantic embeddings, not exact matching |
| Unit numbering inconsistent | Pattern recognition with multiple formats |
| OCR errors | Post-process with spell check, context validation |
| OR questions | Detect markers, treat as alternatives |
| Section variations | Normalize section names |

---

## 4.7 Notes & References (Future Premium System)

### Overview

**Notes** are curated study materials that complement question papers and syllabi. This is a **future premium feature** that enables sustainable development.

---

### Content Types

**1. Notes**
- Handwritten notes (scanned/digitized)
- Typed study materials
- AI-assisted summaries
- Concept explanations
- Solved examples

**2. References**
- Textbook recommendations
- Online resources
- Research papers
- Video lectures
- Practice problems

---

### Access Control Levels

| User Type | Access Level | Notes | References | Question Papers | Syllabus | RQ |
|-----------|--------------|-------|------------|-----------------|----------|-----|
| **Guest** | None | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Logged-in** | Basic | ❌ | ✅ Preview | ✅ | ✅ | ✅ |
| **Contributor** | Partial | ✅ Own + Featured | ✅ | ✅ | ✅ | ✅ |
| **Premium** | Full | ✅ All | ✅ All | ✅ | ✅ | ✅ |

---

### Unlock Model (Ethical Access)

**Philosophy**: Knowledge should be accessible, but sustainability matters

**Options to Unlock Premium**:
1. **Small Contribution** (One-time)
   - Contribute content (papers, notes)
   - Help with quality review
   - Fix errors or improve data

2. **Small Donation** (Optional)
   - Support hosting costs
   - Support content creation
   - No pressure, voluntary

3. **Community Participation**
   - Active on forums
   - Help other students
   - Build reputation

**Key Principles**:
- ✅ No subscription pressure
- ✅ No aggressive monetization
- ✅ Ethical academic access
- ✅ Students come first
- ✅ Premium enables sustainability, not profit

---

### Content Structure

```json
{
  "code": "PHYDSC101T",
  "notes": [
    {
      "id": "n001",
      "title": "Unit 1 Summary",
      "type": "pdf",
      "author": "community",
      "accessLevel": "free",
      "path": "derived/notes/public/PHYDSC101T-unit1.pdf"
    },
    {
      "id": "n002",
      "title": "Complete Study Guide",
      "type": "pdf",
      "author": "verified-contributor",
      "accessLevel": "premium",
      "path": "derived/notes/premium/PHYDSC101T-complete.pdf"
    }
  ],
  "references": [
    {
      "title": "Concepts of Physics",
      "author": "H.C. Verma",
      "type": "textbook",
      "isbn": "978-8177091875",
      "relevance": "primary"
    }
  ]
}
```

---

### Implementation Notes

> ⚠️ **This is FUTURE ONLY**. No implementation in this phase.

When implementing later:
1. Build authentication system first
2. Create contribution tracking
3. Implement access control
4. Design admin review workflow
5. Add payment integration (optional)
6. Build contributor dashboard

---

## 4.8 Browse & Paper Page Redesign (Conceptual)

### Current Paper Page

Currently shows:
- Paper metadata
- PDF link (if available)
- Syllabus section (if available)
- Repeated Questions section (if available)

**Issues**:
- No distinction between original and cleaned PDFs
- Limited graceful degradation
- No preview capabilities
- No indication of premium content

---

### Proposed Paper Page Redesign

Each paper page should offer:

```
┌─────────────────────────────────────┐
│  PHYDSC101T (2023)                  │
│  Mechanics and Properties of Matter │
└─────────────────────────────────────┘

┌─── 📄 Question Papers ──────────────┐
│                                     │
│  ⭐ Original PDF                    │
│  └─ Authentic university document   │
│  [Download Original]                │
│                                     │
│  ✨ Enhanced PDF                    │
│  └─ AI-cleaned for readability      │
│  [Download Enhanced]                │
│                                     │
└─────────────────────────────────────┘

┌─── 📘 Syllabus ─────────────────────┐
│                                     │
│  [View Complete Syllabus]           │
│  [Download Syllabus PDF]            │
│                                     │
└─────────────────────────────────────┘

┌─── 🔁 Repeated Questions ───────────┐
│                                     │
│  Unit-wise analysis of repeated     │
│  questions across years             │
│  [View Analysis]                    │
│                                     │
└─────────────────────────────────────┘

┌─── 🧠 Notes & References ───────────┐
│  🔒 Premium Content                 │
│                                     │
│  • Complete study guide             │
│  • Solved examples                  │
│  • Reference materials              │
│                                     │
│  [Unlock Access]                    │
└─────────────────────────────────────┘
```

---

### UI Design Principles

**1. Asset Type Clarity**
- Original PDFs = 📄 archival authenticity
- AI PDFs = ✨ readability & printing
- Notes = 🧠 study aids

**2. Status Communication**
- Available: Show download button
- Processing: Show progress indicator
- Not available: Show "Request" or "Coming Soon"
- Premium: Show lock icon + unlock option

**3. Graceful Degradation**
- If original PDF missing: Show notice
- If cleaned PDF missing: Don't show section
- If syllabus missing: Show upload option
- If RQ missing: Show "Analysis in progress"

**4. Mobile-First**
- Large touch targets
- Collapsible sections
- Lazy loading
- Offline support (future)

---

### Browse Page Enhancements

Add filters for:
- Papers with cleaned PDFs
- Papers with complete syllabus
- Papers with RQ analysis
- Papers with notes available

Add indicators:
- ✨ = Enhanced PDF available
- 📘 = Syllabus available
- 🔁 = RQ analysis available
- 🧠 = Notes available

---

## 4.9 Automation Boundaries

### What Should Be Automated

✅ **Automated Tasks**:
- OCR of scanned documents
- Text extraction from PDFs
- JSON generation from structured text
- AI-enhanced PDF creation
- Similarity detection for repeated questions
- Basic quality checks
- Format validation
- Metadata extraction

**Benefits**:
- Scales with content growth
- Consistent quality
- Faster turnaround
- Reduces human error

---

### What Requires Human Review

👤 **Manual/Review Tasks**:
- Admin approval before publication
- Metadata correction when AI fails
- Subject matter validation
- Quality assessment
- Final publish decision
- Dispute resolution
- Policy decisions

**Benefits**:
- Maintains quality standards
- Catches AI errors
- Provides accountability
- Ensures accuracy

---

### Automation Workflow

```
Automated → Review → Publish
   ↓          ↓        ↓
  Fast      Accurate  Trusted
```

**Rules**:
1. **Automation first**: Try to automate everything reasonable
2. **Human validation**: Critical decisions need human review
3. **Feedback loop**: Human corrections improve AI over time
4. **Audit trail**: Track who approved what and when

---

## 4.10 Repository Philosophy Going Forward

### Core Principles

**1. Data-Driven Architecture**
- UI is a **consumer**, not an interpreter
- All content references live in structured data
- Changes to data require no code changes
- Code implements contracts, data fills contracts

**2. JSON as Contract**
- JSON schemas are **versioned APIs**
- UI depends on schema, not file paths
- Breaking schema changes require migration
- Schema evolution is planned and documented

**3. PDFs as Assets, Not Logic**
- PDFs are **binary assets**, not data sources
- Never parse PDFs in UI code
- Extraction happens in pipeline
- UI displays pre-processed data

**4. Separation of Concerns**

```
┌─────────────┐
│     UI      │  ← Presents data
└──────┬──────┘
       │
┌──────┴──────┐
│  Metadata   │  ← Describes what exists
└──────┬──────┘
       │
┌──────┴──────┐
│  Pipeline   │  ← Processes raw data
└──────┬──────┘
       │
┌──────┴──────┐
│ Raw Assets  │  ← Source of truth
└─────────────┘
```

**5. Progressive Enhancement**
- Core functionality works without JavaScript
- Enhanced features when JS available
- Graceful degradation always
- Mobile-first mindset

**6. Community-Driven Content**
- Users contribute papers
- Users improve data
- Users report errors
- Users benefit collectively

---

### Design Patterns

**Pattern 1: Metadata Resolution**
```javascript
// UI never hardcodes paths
const paper = getPaperMetadata(paperId);
const pdfUrl = resolvePdfUrl(paper.assets.questionPaper.original);
```

**Pattern 2: Feature Flags**
```javascript
// Features can be toggled without code changes
if (features.enhancedPdfs) {
  showEnhancedPdfButton();
}
```

**Pattern 3: Schema Validation**
```javascript
// All data validated before use
const syllabus = validateSyllabus(rawData);
if (!syllabus.valid) {
  showError(syllabus.errors);
}
```

---

### Future Flexibility

This architecture enables:
- ✅ Changing storage backends (GitHub → Supabase)
- ✅ Adding new content types
- ✅ Introducing new features
- ✅ Scaling to multiple universities
- ✅ Supporting mobile apps
- ✅ API for third-party integrations

---

## Phase 4 Acceptance (Planning Only)

This phase is complete when:

- ✅ No files moved
- ✅ No scripts added
- ✅ No schema changed
- ✅ No code refactored
- ✅ Clear future-ready architecture defined
- ✅ Automation paths documented
- ✅ Premium system planned, not implemented
- ✅ Storage strategy decided
- ✅ Pipeline workflows designed
- ✅ UI/UX changes conceptualized

---

## Next Steps (Future Phases)

**Phase 5**: Infrastructure Setup
- Set up PDF storage (Supabase or GitHub)
- Create upload interface
- Implement basic pipeline

**Phase 6**: Syllabus Automation
- Build OCR pipeline
- Implement AI extraction
- Create review interface

**Phase 7**: RQ Automation
- Build question detection
- Implement similarity matching
- Generate RQ JSON

**Phase 8**: Premium System
- Build authentication
- Implement access control
- Create contributor dashboard

---

## Conclusion

This document establishes the architectural vision for ExamArchive-v2's evolution from a simple paper archive to a comprehensive academic platform. By separating raw sources from derived content, implementing automated pipelines, and planning for premium features, we create a foundation that:

- **Scales** with content growth
- **Maintains** quality standards
- **Enables** future features
- **Preserves** academic integrity
- **Serves** student needs

**This is planning only** — implementation will follow in subsequent phases with careful testing and validation.

---

**Document Status**: ✅ Complete  
**Review Status**: Pending  
**Implementation Status**: Not Started (As Intended)
