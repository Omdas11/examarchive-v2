# Admin Review & Workflow

**Status**: 🔮 Future Ready (Phase 7 Architecture)

This directory contains **admin review queues and workflow metadata**.

## Purpose

Track content pending admin approval separately from published content to:
- Prevent draft content from appearing publicly
- Enable admin review workflow
- Maintain audit trail
- Support rollback capability

## Structure

```
admin/
└── review-queues/         # Items pending admin review
    └── README.md
```

## Workflow States

```
draft → needs_review → [approved | rejected] → published
```

## Security

- Review queues are **not publicly accessible**
- Only admins and moderators can access
- Authentication required via Supabase Auth (Phase 8)

## Current Status

**Not yet in use** - will be implemented in Phase 8+

---

**Created**: 2026-01-30 (Phase 7)  
**Implementation**: Phase 8+
