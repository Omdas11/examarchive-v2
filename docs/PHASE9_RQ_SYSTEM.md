# Phase 9 — Repeated Questions (RQ) System

**Document Version**: 1.0  
**Date**: 2026-01-31  
**Status**: 📋 Planning (Not Implemented)

> ⚠️ **PLANNING ONLY**: This document outlines future work. No implementation in Phase 9.

---

## Executive Summary

Phase 9 will implement a **Repeated Questions (RQ) extraction and publishing system** that identifies questions appearing multiple times across different exam papers. The system follows the established **RAW → DERIVED** pipeline with **mandatory admin approval**.

---

## Core Principles

### 1. RAW → DERIVED Pipeline

**RAW Sources**:
- Question paper PDFs (stored in `/papers/assam-university/`)
- Already uploaded and organized by programme/subject/year

**DERIVED Outputs**:
- RQ JSON files (stored in `/data/repeated-questions/`)
- Optional: RQ PDF compilations (admin-approved)

**Process**:
1. Extract questions from RAW PDFs (OCR + AI)
2. Match questions across papers (similarity algorithm)
3. Generate RQ JSON (grouped by topic/subject)
4. Admin reviews and approves
5. Publish to `/data/repeated-questions/`

### 2. Schema LOCKED

**Schema**: `docs/schema/repeated-questions-schema.md` (RQ-v1.1)

❌ **No schema modifications allowed**  
✅ Must use existing schema structure

**Key Fields**:
- `questionId` - Unique identifier
- `questionText` - Extracted question text
- `appearedIn` - Array of papers where question appeared
- `frequency` - Number of times question appeared
- `subject` - Subject classification
- `topic` - Topic classification
- `difficulty` - Estimated difficulty level

### 3. Admin Approval Mandatory

**Workflow**:
1. AI/Tool extracts questions from PDFs
2. AI/Tool matches repeated questions
3. System generates RQ JSON **draft**
4. Admin reviews draft (checks accuracy, removes false positives)
5. Admin approves and publishes
6. RQ JSON becomes public in `/data/repeated-questions/`

**No Auto-Publishing**: AI cannot publish RQ data without admin verification.

### 4. AI: Optional, Draft-Only

**AI Assistance**:
- ✅ AI can extract questions from PDFs (OCR + parsing)
- ✅ AI can match similar questions (embedding-based similarity)
- ✅ AI can suggest topics/difficulty levels
- ❌ AI **cannot** auto-publish RQ JSON
- ❌ AI **cannot** bypass admin review

**Model Requirements**:
- Open-source or free-tier models only
- Model-agnostic architecture (configurable)
- Must work without AI (manual extraction allowed)

---

## Pipeline Architecture

### Stage 1: Question Extraction

**Input**: RAW PDF question papers  
**Process**:
1. OCR PDF to extract text (if needed)
2. Parse questions (identify Q1, Q2, etc.)
3. Clean and normalize text
4. Store in temporary extraction format

**Tools**:
- pdf.js or pdf-lib for PDF reading
- Tesseract OCR (if scanned PDFs)
- AI for question parsing (optional)

### Stage 2: Question Matching

**Input**: Extracted questions from multiple papers  
**Process**:
1. Generate embeddings for each question (AI or similarity algorithm)
2. Compare embeddings across papers
3. Identify questions with high similarity (>80% match)
4. Group repeated questions by subject/topic

**Tools**:
- AI embedding models (e.g., sentence-transformers)
- Similarity metrics (cosine similarity)
- Clustering algorithms

### Stage 3: RQ JSON Generation

**Input**: Matched question groups  
**Process**:
1. Format matched questions into RQ schema
2. Add metadata (frequency, papers, years)
3. Suggest topics/difficulty (AI-assisted)
4. Generate RQ JSON draft

**Output**: Draft RQ JSON (awaiting admin approval)

### Stage 4: Admin Review

**UI**: Admin dashboard RQ review page (to be implemented)  
**Process**:
1. Admin views draft RQ JSON
2. Admin verifies question matches (removes false positives)
3. Admin edits metadata (topics, difficulty)
4. Admin approves or rejects

**Output**: Approved RQ JSON or rejection feedback

### Stage 5: Publishing

**Process**:
1. Approved RQ JSON moved to `/data/repeated-questions/`
2. Commit to repository
3. JSON becomes available on browse page

---

## Permission Requirements

**Roles**:
- **Admin**: Full access (extract, review, approve, publish)
- **Reviewer**: Can assist with review (cannot publish)
- **User**: Can view published RQ (cannot extract or review)
- **Guest**: Can view published RQ

**Admin Permissions** (from Phase 8 role system):
- `review_submissions`
- `approve_reject`
- `publish`

---

## AI Policy

### Allowed Models

**Open-Source**:
- ✅ LLaMA 3 (question extraction)
- ✅ Mistral (text parsing)
- ✅ Gemma (similarity matching)

**Free-Tier APIs**:
- ✅ Gemini Flash (OCR + extraction)
- ✅ Claude Haiku (question parsing)

**Local Models**:
- ✅ Ollama (local LLM)
- ✅ sentence-transformers (embeddings)

### Prohibited

❌ Paid-only APIs without free alternative  
❌ Auto-publishing AI  
❌ Models that require credit cards for students

---

## Implementation Checklist (Future)

### Backend
- [ ] Create RQ extraction script (`scripts/extract-rq.js`)
- [ ] Implement question matching algorithm
- [ ] Add RQ JSON validation (against schema)
- [ ] Create admin review API endpoints (Supabase functions)

### UI
- [ ] Admin RQ review dashboard page
- [ ] RQ draft listing and approval interface
- [ ] RQ publishing workflow
- [ ] RQ display on browse page (enhancement)

### Testing
- [ ] Test extraction with sample PDFs
- [ ] Test matching accuracy
- [ ] Test schema compliance
- [ ] Test admin approval workflow

### Documentation
- [ ] RQ extraction guide
- [ ] Admin review manual
- [ ] Troubleshooting guide

---

## Success Criteria

### Functional
✅ Questions extracted from PDFs accurately  
✅ Repeated questions matched correctly (>90% accuracy)  
✅ RQ JSON follows locked schema  
✅ Admin can review and approve RQ drafts  
✅ Published RQ appears on browse page

### Non-Functional
✅ Extraction works without AI (manual fallback)  
✅ Uses only open-source or free AI models  
✅ No auto-publishing (admin approval required)  
✅ Schema locked (no modifications)

---

## Open Questions

- **PDF Quality**: How to handle low-quality scanned PDFs?
- **Question Variants**: How to match questions with slight wording changes?
- **Multi-Language**: How to handle questions in multiple languages?
- **Performance**: Can extraction run in GitHub Actions or needs server?

---

**Phase 9 Status**: 📋 Planning  
**Blocked By**: Admin dashboard UI (future work)  
**Next Steps**: Prototype extraction script, test matching algorithm

---

**Document Ends**
