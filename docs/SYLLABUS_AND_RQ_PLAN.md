# Syllabus & Repeated Questions Plan

> Phase 3 (Syllabus) and Phase 4 (Repeated Questions). Not active yet.

---

## Syllabus System (Phase 3)

### Goal

Replicate official university syllabi in a structured, searchable format.

### Requirements

- Full official syllabus content (not summaries)
- University → Department → Programme → Subject → Semester → Units
- Schema-first design — data structure before UI
- Assam University first, extensible to other universities later

### Schema (Draft)

```json
{
  "university": "Assam University",
  "department": "Physics",
  "programme": "CBCS",
  "subject": "Physics",
  "semester": 1,
  "paper_code": "PHSHCC101T",
  "paper_name": "Mathematical Physics - I",
  "units": [
    {
      "number": 1,
      "title": "Vectors and Vector Spaces",
      "topics": ["..."]
    }
  ]
}
```

### Current State

- Partial syllabus data exists in `data/syllabus/`
- Template for PDF generation exists in `templates/syllabus.html`
- Build script exists in `scripts/generate-syllabus-pdf.js`
- **Not complete or verified against official syllabus**

---

## Repeated Questions (Phase 4)

### Goal

Identify and catalog frequently repeated exam questions, linked to syllabus units.

### Requirements

- Human-generated entries (not automated)
- Each RQ linked to a specific paper code and unit
- Admin approval required before visibility
- PDF generation for downloadable RQ sheets

### Schema (Draft)

```json
{
  "paper_code": "PHSHCC101T",
  "unit": 1,
  "question": "Derive the expression for...",
  "years_appeared": [2020, 2021, 2023],
  "frequency": 3,
  "source": "human",
  "approved": false
}
```

### Current State

- Directory structure exists: `data/repeated-questions/`
- **No actual content yet**
- AI drafts planned for Phase 6 (human approval mandatory)

---

## Timeline

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 3 | Syllabus system | Not started |
| Phase 4 | Repeated questions | Not started |
| Phase 6 | AI-assisted RQ drafts | Not started (requires Phase 4 first) |
