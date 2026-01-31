# Phase 12 — AI Automation & Model-Agnostic Design

**Document Version**: 1.0  
**Date**: 2026-01-31  
**Status**: 📋 Planning (Not Implemented)

> ⚠️ **PLANNING ONLY**: This document outlines future work. No implementation in Phase 12.

---

## Executive Summary

Phase 12 establishes a **model-agnostic AI automation framework** that enables:
- Configuration-based AI model selection
- Local and cloud AI model support
- Prompt template management
- Schema-driven validation
- **No paid-only APIs** (open-source or free-tier only)

---

## Core Principles

### 1. Model-Agnostic Architecture

**Principle**: AI pipelines must work with **any compatible model**.

**Requirements**:
- Configuration file specifies which model to use
- Prompts stored as templates (separate from code)
- Output validated against schemas (not model-specific)
- Fallback to manual process if AI unavailable

### 2. No Paid-Only Dependencies

**Allowed AI**:
- ✅ Open-source models (LLaMA, Mistral, Gemma, Phi-3)
- ✅ Free-tier APIs with generous limits (Gemini Flash, Claude Haiku)
- ✅ Local models (Ollama, llama.cpp, vLLM)
- ✅ University-hosted models (if available)

**Prohibited**:
- ❌ Paid-only APIs (GPT-4 Pro, Claude Sonnet without free tier)
- ❌ APIs requiring credit cards for students
- ❌ Closed-source models with restrictive licenses

### 3. AI as Assistant, Not Authority

**Rule**: AI generates drafts, humans approve.

**No Auto-Publishing**:
- AI cannot publish content directly
- Admin must review all AI-generated content
- AI outputs are **suggestions**, not facts

### 4. Schema-Driven Validation

**All AI outputs must conform to locked schemas**:
- Syllabus schema (v1.0)
- Repeated Questions schema (RQ-v1.1)
- Notes schema (to be defined in Phase 11)

**Validation**:
- JSON schema validation
- Type checking
- Required field verification
- Fallback to manual editing if AI output invalid

---

## AI Configuration System

### Configuration File

**Location**: `ai/config.json`

**Structure**:
```json
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
    },
    "notes_generation": {
      "primary": "claude-haiku",
      "fallback": "ollama-mistral",
      "local": "mistral-7b"
    }
  },
  "prompts": {
    "syllabus_extraction": "ai/prompts/syllabus-extraction.txt",
    "rq_matching": "ai/prompts/rq-matching.txt",
    "notes_outline": "ai/prompts/notes-outline.txt"
  },
  "schemas": {
    "syllabus": "docs/schema/syllabus-schema.md",
    "repeated_questions": "docs/schema/repeated-questions-schema.md",
    "notes": "docs/schema/notes-schema.md"
  },
  "api_keys": {
    "gemini": "GEMINI_API_KEY",
    "claude": "CLAUDE_API_KEY"
  }
}
```

### Model Switching

**Runtime Selection**:
```javascript
// ai/model-loader.js
async function loadModel(taskType) {
  const config = await loadConfig();
  const modelConfig = config.models[taskType];
  
  // Try primary model
  try {
    return await loadPrimaryModel(modelConfig.primary);
  } catch (err) {
    console.warn('Primary model failed, trying fallback');
  }
  
  // Try fallback model
  try {
    return await loadFallbackModel(modelConfig.fallback);
  } catch (err) {
    console.warn('Fallback model failed, trying local');
  }
  
  // Try local model
  try {
    return await loadLocalModel(modelConfig.local);
  } catch (err) {
    console.error('All models failed, manual process required');
    throw new Error('AI unavailable, manual process required');
  }
}
```

---

## Prompt Template System

### Prompt Storage

**Location**: `ai/prompts/`

**Files**:
- `syllabus-extraction.txt` - Prompt for extracting syllabus
- `rq-matching.txt` - Prompt for matching repeated questions
- `notes-outline.txt` - Prompt for generating notes outline
- `notes-expansion.txt` - Prompt for expanding notes

### Template Variables

**Example Prompt** (`ai/prompts/syllabus-extraction.txt`):
```
You are a syllabus extraction assistant. Extract structured data from the syllabus text below.

Syllabus Text:
{{SYLLABUS_TEXT}}

Output Format (JSON):
{
  "subject": "Subject name and code",
  "units": [
    {
      "unitNumber": 1,
      "unitTitle": "Unit title",
      "topics": ["topic1", "topic2"]
    }
  ],
  "referenceBooks": ["book1", "book2"],
  "evaluationScheme": {
    "internal": 30,
    "external": 70
  }
}

Extract the syllabus data and return ONLY valid JSON.
```

**Usage**:
```javascript
const promptTemplate = await fs.readFile('ai/prompts/syllabus-extraction.txt', 'utf-8');
const prompt = promptTemplate.replace('{{SYLLABUS_TEXT}}', extractedText);
const response = await model.generate(prompt);
```

---

## Local Model Deployment

### Ollama Integration

**Setup**:
1. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
2. Pull model: `ollama pull llama3`
3. Start server: `ollama serve`

**Usage**:
```javascript
// ai/providers/ollama.js
async function generateWithOllama(prompt, modelName) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      prompt: prompt,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}
```

### llama.cpp Integration

**Setup**:
1. Clone llama.cpp: `git clone https://github.com/ggerganov/llama.cpp`
2. Build: `make`
3. Download model: `wget https://huggingface.co/...`
4. Run server: `./server -m model.gguf`

**Usage**:
```javascript
// ai/providers/llamacpp.js
async function generateWithLlamaCpp(prompt, modelPath) {
  const response = await fetch('http://localhost:8080/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt,
      n_predict: 512
    })
  });
  
  const data = await response.json();
  return data.content;
}
```

---

## Schema Validation

### Validation Pipeline

**Flow**:
1. AI generates JSON output
2. Parse JSON (catch syntax errors)
3. Validate against schema (JSON Schema)
4. Check required fields
5. Verify data types
6. If invalid: Log error, request manual edit
7. If valid: Present to admin for review

**Example**:
```javascript
// ai/validators/schema-validator.js
import Ajv from 'ajv';

async function validateSyllabusJSON(syllabusData) {
  const schema = await loadSchema('docs/schema/syllabus-schema.md');
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  
  if (!validate(syllabusData)) {
    console.error('Validation errors:', validate.errors);
    return {
      valid: false,
      errors: validate.errors
    };
  }
  
  return { valid: true };
}
```

---

## API Provider Abstraction

### Provider Interface

**Interface**:
```javascript
// ai/providers/base.js
class AIProvider {
  async generate(prompt, options) {
    throw new Error('generate() must be implemented');
  }
  
  async embed(text) {
    throw new Error('embed() must be implemented');
  }
  
  isAvailable() {
    throw new Error('isAvailable() must be implemented');
  }
}
```

**Implementations**:
- `ai/providers/gemini.js` - Google Gemini
- `ai/providers/claude.js` - Anthropic Claude
- `ai/providers/ollama.js` - Local Ollama
- `ai/providers/llamacpp.js` - Local llama.cpp

### Provider Factory

**Factory**:
```javascript
// ai/providers/factory.js
function createProvider(modelName) {
  if (modelName.startsWith('gemini-')) {
    return new GeminiProvider();
  } else if (modelName.startsWith('claude-')) {
    return new ClaudeProvider();
  } else if (modelName.startsWith('ollama-')) {
    return new OllamaProvider();
  } else if (modelName === 'llama.cpp') {
    return new LlamaCppProvider();
  }
  
  throw new Error(`Unknown model: ${modelName}`);
}
```

---

## Cost & Accessibility

### Free-Tier Usage Guidelines

**Gemini Flash** (Google):
- Free tier: 15 requests/minute, 1500 requests/day
- Suitable for: Syllabus extraction, notes generation
- Cost: $0 (free)

**Claude Haiku** (Anthropic):
- Free tier: Limited (check current limits)
- Suitable for: Notes improvement, grammar checking
- Cost: $0 (free tier)

**Local Models** (Ollama/llama.cpp):
- Cost: $0 (runs on local machine)
- Requirements: 8GB+ RAM, GPU recommended
- Suitable for: All tasks (slower than cloud)

### Student Accessibility

**Principle**: No student should be blocked from contributing.

**Solutions**:
- Free-tier APIs for cloud users
- Local models for privacy-conscious users
- Manual process for users without AI access
- University-hosted models (future)

---

## Implementation Checklist (Future)

### Configuration
- [ ] Create `ai/config.json`
- [ ] Define model configurations
- [ ] Add API key management (env vars)

### Prompt Templates
- [ ] Create `ai/prompts/` directory
- [ ] Write syllabus extraction prompt
- [ ] Write RQ matching prompt
- [ ] Write notes generation prompts

### Providers
- [ ] Implement Gemini provider
- [ ] Implement Claude provider
- [ ] Implement Ollama provider
- [ ] Implement llama.cpp provider

### Validation
- [ ] Build JSON schema validator
- [ ] Add schema compliance checks
- [ ] Create error reporting

### Testing
- [ ] Test each provider
- [ ] Test model switching
- [ ] Test schema validation
- [ ] Test offline mode (local models)

### Documentation
- [ ] AI configuration guide
- [ ] Local model setup guide
- [ ] Prompt writing guide
- [ ] Troubleshooting guide

---

## Success Criteria

### Functional
✅ AI works with multiple models (Gemini, Claude, Ollama)  
✅ Prompts stored as templates (easy to edit)  
✅ Outputs validated against schemas  
✅ Fallback to local models if cloud unavailable  
✅ Manual process available if AI unavailable

### Non-Functional
✅ Uses only open-source or free AI  
✅ No paid-only dependencies  
✅ Model-agnostic architecture  
✅ Student-accessible

---

## Open Questions

- **Rate Limits**: How to handle API rate limits gracefully?
- **Model Quality**: Minimum accuracy threshold for AI outputs?
- **Fallback Priority**: Should local or cloud be primary?
- **Caching**: Should AI responses be cached?

---

**Phase 12 Status**: 📋 Planning  
**Blocked By**: Phases 9-11 implementation  
**Next Steps**: Prototype model-agnostic framework, test providers

---

**Document Ends**
