# Phase 10 — Syllabus Extraction System

**Document Version**: 1.0  
**Date**: 2026-01-31  
**Status**: 📋 Planning (Not Implemented)

> ⚠️ **PLANNING ONLY**: This document outlines future work. No implementation in Phase 10.

---

## Executive Summary

Phase 10 will implement a **Syllabus Extraction System** that converts syllabus PDFs into structured JSON data for display on the browse page. The system follows the **RAW → DERIVED** pipeline with **mandatory admin approval**.

---

## Core Principles

### 1. RAW → DERIVED Pipeline

**RAW Sources**:
- Syllabus PDFs (stored in `/papers/assam-university/syllabus/` or similar)
- Manually uploaded by admins or contributors

**DERIVED Outputs**:
- Syllabus JSON files (stored in `/data/syllabus/`)
- Structured data for browse page display

**Process**:
1. Extract text from RAW syllabus PDFs (OCR if needed)
2. Parse syllabus structure (AI-assisted)
3. Generate syllabus JSON (following locked schema)
4. Admin reviews and edits
5. Admin approves and publishes
6. JSON becomes public in `/data/syllabus/`

### 2. Schema LOCKED

**Schema**: `docs/schema/syllabus-schema.md` (v1.0)

❌ **No schema modifications allowed**  
✅ Must use existing schema structure

**Key Fields**:
- `subject` - Subject name and code
- `units` - Array of syllabus units
- `topics` - Array of topics per unit
- `referenceBooks` - Recommended books
- `evaluationScheme` - Marks distribution

### 3. Admin Approval Mandatory

**Workflow**:
1. Upload syllabus PDF to system
2. OCR + AI extracts text and structure
3. System generates syllabus JSON **draft**
4. Admin reviews draft (verifies accuracy, fixes errors)
5. Admin approves and publishes
6. Syllabus JSON becomes public

**No Auto-Publishing**: AI cannot publish syllabus data without admin verification.

### 4. AI: Optional, Draft-Only

**AI Assistance**:
- ✅ AI can extract text from PDFs (OCR)
- ✅ AI can parse syllabus structure (units, topics)
- ✅ AI can identify reference books
- ❌ AI **cannot** auto-publish syllabus JSON
- ❌ AI **cannot** bypass admin review

**Model Requirements**:
- Open-source or free-tier models only
- Model-agnostic architecture
- Must work without AI (manual extraction allowed)

---

## Pipeline Architecture

### Stage 1: PDF Upload

**Input**: Syllabus PDF file  
**Process**:
1. User uploads PDF via admin interface
2. PDF stored in RAW location
3. Extraction job queued

**Storage**: `/papers/assam-university/syllabus/{programme}/{subject}/`

### Stage 2: Text Extraction

**Input**: Syllabus PDF  
**Process**:
1. Check if PDF is text-based or scanned
2. If text-based: Extract text directly
3. If scanned: Use OCR (Tesseract or AI OCR)
4. Clean and normalize text

**Tools**:
- pdf.js for text extraction
- Tesseract OCR or Gemini Vision API for scanned PDFs

### Stage 3: Structure Parsing

**Input**: Extracted text  
**Process**:
1. Identify syllabus sections (units, topics, books)
2. Parse unit structure (Unit 1, Unit 2, etc.)
3. Extract topics per unit
4. Extract reference books
5. Extract evaluation scheme

**AI Assistance**:
- Prompt: "Parse this syllabus into units, topics, and reference books"
- AI returns structured data
- Human admin verifies and corrects

### Stage 4: JSON Generation

**Input**: Parsed syllabus structure  
**Process**:
1. Format data into syllabus schema
2. Validate against locked schema
3. Generate draft syllabus JSON

**Output**: Draft JSON (awaiting admin approval)

### Stage 5: Admin Review

**UI**: Admin syllabus review dashboard  
**Process**:
1. Admin views draft JSON alongside original PDF
2. Admin verifies units, topics, books
3. Admin edits any errors
4. Admin approves or rejects

**Output**: Approved syllabus JSON

### Stage 6: Publishing

**Process**:
1. Approved JSON moved to `/data/syllabus/`
2. Commit to repository
3. JSON displayed on browse page

---

## Permission Requirements

**Roles**:
- **Admin**: Full access (upload, extract, review, approve, publish)
- **Reviewer**: Can assist with review (cannot publish)
- **User**: Can view published syllabus (cannot upload or review)
- **Guest**: Can view published syllabus

**Admin Permissions**:
- `review_submissions`
- `approve_reject`
- `publish`

---

## AI Policy

### Allowed Models

**Open-Source**:
- ✅ LLaMA 3 (text parsing)
- ✅ Mistral (structure extraction)
- ✅ Gemma (OCR + parsing)

**Free-Tier APIs**:
- ✅ Gemini Flash (OCR + extraction)
- ✅ Claude Haiku (structure parsing)

**Local Models**:
- ✅ Ollama (local LLM)
- ✅ Tesseract OCR (open-source)

### Prohibited

❌ Paid-only APIs  
❌ Auto-publishing AI  
❌ Models requiring credit cards

---

## Implementation Checklist (Future)

### Backend
- [ ] Create syllabus upload API
- [ ] Implement OCR + text extraction
- [ ] Build structure parsing (AI-assisted)
- [ ] Add JSON validation (schema compliance)
- [ ] Create admin review API

### UI
- [ ] Syllabus upload page
- [ ] Admin syllabus review dashboard
- [ ] Draft approval interface
- [ ] Syllabus display on browse page

### Testing
- [ ] Test with various PDF formats
- [ ] Test OCR accuracy
- [ ] Test schema compliance
- [ ] Test admin workflow

### Documentation
- [ ] Syllabus extraction guide
- [ ] Admin review manual
- [ ] Troubleshooting guide

---

## Success Criteria

### Functional
✅ Syllabus PDFs extracted accurately  
✅ Structure parsed correctly (units, topics, books)  
✅ JSON follows locked schema  
✅ Admin can review and approve drafts  
✅ Published syllabus appears on browse page

### Non-Functional
✅ Works without AI (manual fallback)  
✅ Uses only open-source or free AI  
✅ No auto-publishing  
✅ Schema locked

---

## Open Questions

- **PDF Formats**: How to handle non-standard syllabus formats?
- **Multi-Programme**: How to handle syllabus shared across programmes?
- **Version Control**: How to update syllabus when changed?
- **OCR Accuracy**: Minimum OCR quality threshold?

---

**Phase 10 Status**: 📋 Planning  
**Blocked By**: Admin dashboard UI  
**Next Steps**: Prototype OCR extraction, test parsing

---

**Document Ends**
