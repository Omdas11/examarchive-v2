# Storage Directory

**Status**: 🔮 Future Ready (Phase 7 Architecture)

This directory is created as part of Phase 7 architecture planning to establish a **clean separation between raw authoritative sources and derived/generated content**.

## Purpose

The `/storage/` directory will house:
- **Raw academic sources** (authoritative, immutable)
- **Derived content** (generated, reproducible)

## Structure

```
storage/
├── raw/                  # Authoritative academic sources (immutable)
│   ├── papers/           # Original question papers (as issued by university)
│   ├── syllabus/         # Original syllabus PDFs
│   └── references/       # Textbooks, additional materials
└── derived/              # Generated content (reproducible)
    ├── syllabus-json/    # Extracted syllabus JSON
    ├── rq-json/          # Extracted Repeated Questions JSON
    ├── rq-pdf/           # Generated RQ PDF (optional)
    ├── ai-pdfs/          # AI-enhanced PDFs (cleaned, normalized)
    └── notes/            # Study notes
        ├── public/       # Free access notes
        └── premium/      # Premium access notes
```

## Design Principles

### Raw Sources (`/raw/`)
- **Immutable**: Never modify after upload
- **Authoritative**: Single source of truth
- **Versioned**: Preserve history
- **Organized**: Mirror academic structure (university → subject → programme)

### Derived Content (`/derived/`)
- **Reproducible**: Can be regenerated from raw sources
- **Generated**: Created by pipelines (AI or manual)
- **Never Manually Edited**: Once automation exists, regenerate instead of edit
- **Schema-Driven**: Follows locked JSON schemas

## Migration Plan

**Current State** (Phase 7):
- PDFs are in `/papers/`
- Syllabus JSON in `/data/syllabus/`
- RQ JSON in `/data/repeated-questions/`

**Future State** (Phase 8+):
- PDFs will gradually move to `/storage/raw/papers/`
- Generated content will use `/storage/derived/`
- Existing structure will continue to work during transition

## When to Use

**Do NOT use this directory yet** - it is a planning artifact.

Implementation will begin in **Phase 8** (Foundation) when:
- Supabase Storage is set up
- Upload interface is built
- Migration scripts are created

## References

- See `docs/PHASE7_ARCHITECTURE.md` for full details
- See `docs/PHASE4_ARCHITECTURE.md` for storage strategy background
- See `docs/PHASE6_ARCHITECTURE.md` for pipeline designs

---

**Created**: 2026-01-30 (Phase 7)  
**Status**: Planning Only  
**Implementation**: Phase 8+
