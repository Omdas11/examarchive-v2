# AI Configuration & Resources

**Status**: 🔮 Future Ready (Phase 7 Architecture)

This directory contains **all AI-related configuration**, making AI usage transparent, auditable, and model-agnostic.

## Purpose

Centralize AI prompts, schemas, and configuration to:
- **Version control AI behavior** (track prompt changes)
- **Enable model swapping** (configuration-based)
- **Audit AI usage** (what prompts are used where)
- **Separate concerns** (prompts not hardcoded in code)

## Structure

```
ai/
├── prompts/          # Reusable prompt templates
├── schemas/          # JSON schemas for AI output validation
└── README.md         # This file
```

## AI Safety Rules

**Allowed Models**:
- ✅ Open-source (LLaMA, Mistral, Gemma)
- ✅ Free-tier commercial (Gemini Flash, Claude Haiku)
- ✅ Local deployment (Ollama, llama.cpp)

**Prohibited**:
- ❌ Paid-only APIs without free alternative
- ❌ Student-gated AI services

## Current Status

**Not yet in use** - will be implemented in Phase 9+

---

**Created**: 2026-01-30 (Phase 7)  
**Implementation**: Phase 9+
