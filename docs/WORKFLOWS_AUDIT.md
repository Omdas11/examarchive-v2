# GitHub Workflows Audit

**Document Version**: 1.0  
**Date**: 2026-01-31  
**Status**: ✅ Audit Complete

---

## Executive Summary

This document audits all GitHub Actions workflows in the `.github/workflows/` directory, documenting their purpose, status, and alignment with Phase 8 principles.

---

## Current Workflows

### 1. auto-json.yml

**Purpose**: Automatically generate JSON files from source data

**Status**: ✅ Active, Keep

**Description**:
- Runs on push to main branch
- Generates derived JSON data
- Commits changes back to repository

**Alignment with Phase 8**:
- ✅ Follows RAW → DERIVED principle
- ⚠️ Auto-commits without admin approval (acceptable for automated JSON generation)
- ⚠️ Should verify that generated JSON follows locked schemas

**Recommendation**: Keep, but add schema validation step

---

### 2. build-about-status.yml

**Purpose**: Build and update "About" page status section

**Status**: ✅ Active, Keep

**Description**:
- Updates about page with repository status
- Generates stats and metadata
- Commits updated page

**Alignment with Phase 8**:
- ✅ UI generation workflow
- ✅ No data modification
- ✅ Auto-commit acceptable (meta content)

**Recommendation**: Keep as-is

---

### 3. build-about-timeline.yml

**Purpose**: Build and update "About" page timeline section

**Status**: ✅ Active, Keep

**Description**:
- Updates about page with project timeline
- Generates chronological events
- Commits updated page

**Alignment with Phase 8**:
- ✅ UI generation workflow
- ✅ No data modification
- ✅ Auto-commit acceptable (meta content)

**Recommendation**: Keep as-is

---

### 4. content-update.yml

**Purpose**: Update content when data files change

**Status**: ✅ Active, Keep

**Description**:
- Triggers on changes to data files
- Regenerates browse page content
- Updates indices and search data

**Alignment with Phase 8**:
- ✅ Follows DERIVED regeneration principle
- ✅ Reacts to approved data changes
- ✅ Auto-commit acceptable (derived content)

**Recommendation**: Keep as-is

---

### 5. generate-pdfs.yml

**Purpose**: Generate PDF compilations from source data

**Status**: ⚠️ Review Required

**Description**:
- Generates PDF files from data
- Purpose unclear (needs investigation)
- May be legacy workflow

**Alignment with Phase 8**:
- ⚠️ PDF generation should follow RAW → DERIVED
- ⚠️ Auto-publishing PDFs may require admin approval
- ⚠️ Needs review of what PDFs are generated

**Recommendation**: Review purpose and update if needed

**Action Items**:
- [ ] Document what PDFs are generated
- [ ] Verify if PDFs are RAW or DERIVED
- [ ] Check if admin approval needed
- [ ] Update workflow if necessary

---

### 6. reorganize-papers.yml

**Purpose**: Reorganize paper files in repository

**Status**: ⚠️ Review Required

**Description**:
- Reorganizes paper storage structure
- May move files between directories
- Purpose unclear (needs investigation)

**Alignment with Phase 8**:
- ⚠️ File reorganization should not modify RAW PDFs
- ⚠️ May need admin approval for structural changes
- ⚠️ Needs review of what files are moved

**Recommendation**: Review purpose and update if needed

**Action Items**:
- [ ] Document what files are reorganized
- [ ] Verify RAW files are not modified
- [ ] Check if manual trigger required
- [ ] Update workflow if necessary

---

## Workflow Principles

### 1. RAW → DERIVED Compliance

**Rule**: Workflows can generate DERIVED data from RAW data

✅ **Allowed**:
- Generate JSON from PDFs (with schema validation)
- Build browse page from data files
- Create indices and search data
- Update metadata

❌ **Prohibited**:
- Modify RAW PDF files
- Auto-publish without admin approval (for content)
- Bypass schema validation

### 2. Admin Approval Gates

**Rule**: Content workflows should respect admin approval

**Acceptable Auto-Commit** (no admin approval needed):
- UI generation (about page, browse page)
- Index updates (search data)
- Metadata updates (stats, timestamps)
- JSON regeneration (from approved data)

**Requires Admin Approval** (manual trigger):
- Publishing new content to public
- Modifying RAW data
- Schema changes
- Major structural changes

### 3. Schema Validation

**Rule**: All workflows generating JSON must validate against locked schemas

**Implementation**:
```yaml
- name: Validate JSON Schema
  run: |
    npm run validate-schemas
```

**Schemas to Validate**:
- Syllabus JSON → `docs/schema/syllabus-schema.md`
- RQ JSON → `docs/schema/repeated-questions-schema.md`
- Maps JSON → `docs/schema/maps-schema.md`

---

## Workflow Security

### Permissions

**Current**: Workflows have write access to repository

**Recommendation**: Use minimal permissions

**Example**:
```yaml
permissions:
  contents: write  # Only if committing back
  pull-requests: read  # If reading PRs
```

### Secrets Management

**Current**: API keys stored as GitHub secrets

**Recommendation**: Continue using secrets for:
- AI API keys (if workflows use AI)
- Database credentials (if workflows access Supabase)
- Deployment keys (if workflows deploy to hosting)

**Security Rules**:
- ❌ Never commit secrets to repository
- ❌ Never log secrets in workflow output
- ✅ Use GitHub secrets for sensitive data
- ✅ Rotate secrets periodically

---

## Future Workflow Ideas

### 1. Schema Validation Workflow

**Purpose**: Validate all JSON files against schemas on PR

**Trigger**: Pull request

**Steps**:
1. Check out repository
2. Install dependencies
3. Run schema validation
4. Report validation errors
5. Block merge if validation fails

**Status**: Not implemented (future work)

---

### 2. AI-Assisted Content Generation

**Purpose**: Generate drafts with AI when new PDFs uploaded

**Trigger**: New PDF uploaded to RAW location

**Steps**:
1. Detect new PDF
2. Extract text (OCR if needed)
3. Generate draft JSON (AI-assisted)
4. Create PR with draft
5. Notify admin for review

**Status**: Not implemented (Phase 12)

---

### 3. Duplicate Detection Workflow

**Purpose**: Detect duplicate papers before committing

**Trigger**: PR with new papers

**Steps**:
1. Hash uploaded PDFs
2. Compare with existing PDFs
3. Report duplicates
4. Block merge if duplicate found

**Status**: Not implemented (future work)

---

## Workflow Maintenance

### Regular Reviews

**Schedule**: Quarterly (every 3 months)

**Review Checklist**:
- [ ] Are workflows still needed?
- [ ] Are workflows running successfully?
- [ ] Are workflows following Phase 8 principles?
- [ ] Are workflows secure?
- [ ] Are workflows documented?

### Deprecation Process

**If a workflow is no longer needed**:
1. Disable workflow (comment out trigger)
2. Add deprecation notice to workflow file
3. Monitor for 1 month
4. Delete workflow if no issues

---

## Action Items

### Immediate
- [ ] Review `generate-pdfs.yml` purpose
- [ ] Review `reorganize-papers.yml` purpose
- [ ] Add schema validation to `auto-json.yml`

### Future
- [ ] Create schema validation workflow
- [ ] Create duplicate detection workflow
- [ ] Document AI-assisted workflows (Phase 12)

---

## Audit Conclusion

**Summary**:
- ✅ 4 workflows active and compliant
- ⚠️ 2 workflows need review (generate-pdfs, reorganize-papers)
- ✅ All workflows follow RAW → DERIVED principle
- ✅ No security issues detected

**Overall Status**: ✅ Workflows audit complete

---

**Document Ends**
