# ExamArchive – Repeated Questions JSON Schema (LOCKED)

Schema ID: RQ-v1.1  
Status: LOCKED  
Scope: Repeated Questions (RQ)  
Applies to: CBCS / FYUG / UG (Assam University and future universities)

---

## 1. Design Philosophy

This schema is designed to:
- Faithfully represent real university question papers
- Avoid UI-side guessing or inference
- Prevent duplication, numbering bugs, and structural ambiguity
- Allow future extension without breaking old data

Rule:
The schema describes the paper structure.
The UI renders the data.
The UI must never interpret exam rules.

---

## 2. Top-Level Structure

A repeated-questions JSON file MUST have:

- meta (object)
- sections (array)

Conceptual structure:
meta
sections → units → questions / choices → parts

---

## 3. Meta Object (Required)

Fields:
- university (string)
- level (string)
- programme (string)
- subject (string)
- paper_code (string)
- paper_name (string)
- schema_version (string, must be "RQ-v1.1")
- last_updated (ISO date)

Rules:
- schema_version is mandatory
- paper_code must match syllabus and papers.json
- last_updated must follow YYYY-MM-DD

---

## 4. Sections Array (Required)

Each section represents an actual paper section such as A, B, C, or MAIN.

Fields:
- section_id (string, required)
- instruction (string or null, display-only)
- marks_per_question (number, optional metadata)
- units (array, required)

Rules:
- section_id must be unique within the paper
- UI must not infer sections
- instructions are never enforced by UI

---

## 5. Units Array (Required)

Each unit appears exactly once per section.

Fields:
- unit_no (number, canonical)
- unit_label (string, original paper notation e.g. "Unit-I")
- questions OR choices

Rules:
- unit_no is authoritative
- UI must never parse unit_label text
- unit duplication across years is forbidden

---

## 6. Standalone Questions (questions[])

Used mainly for short-answer sections.

Fields:
- question_id (string, required, unique)
- text (string)
- marks (number)
- years (array of numbers, metadata only)

Rules:
- marks must be explicitly stated
- UI must never infer marks
- years must never control rendering

---

## 7. Long Questions with Internal Parts (choices[])

Used mainly for long-answer sections.

Fields:
- choice_id (string, required, unique)
- years (array of numbers, metadata only)
- parts (array, required)

Rules:
- each choice represents ONE full question
- internal parts must belong to the same choice
- UI must not merge or split choices

---

## 8. Parts Array (Required inside choices)

Fields:
- label ("a", "b", "c", etc.)
- text (string)
- marks (number)
- breakup (array of numbers, optional)

Rules:
- marks must match the paper exactly
- breakup is optional and never auto-rendered
- UI must not compute or infer split marks

---

## 9. Numbering Rules (CRITICAL)

- Question numbering is implicit by stored order
- UI must render sequentially as written
- Parts (a), (b), (c) share the same main question number
- UI must never compute numbering from labels or years

---

## 10. Years Handling

Years are historical metadata only.

Rules:
- years must never create duplicate units
- years must never control loops
- years must never affect numbering

---

## 11. Forbidden Practices

The following are NOT allowed:
- Inferring marks
- Auto-splitting marks
- Parsing unit labels like "Unit-I"
- Rendering units per year
- Guessing exam rules in UI
- Renaming or removing locked fields

---

## 12. Allowed Extensions

Future optional fields may be added without breaking compatibility:
- difficulty (easy | medium | hard)
- type (theory | numerical | practical)
- or_group (string)

Rules:
- existing fields must never change meaning
- old JSON files must remain valid

---

## 13. Compatibility Guarantee

Any JSON following RQ-v1.1:
- will render correctly in ExamArchive-v2
- will not break future UI updates
- will not require migration

---

## 14. Final Lock Statement

Repeated Questions JSON Schema RQ-v1.1 is LOCKED.
All future RQ data must follow this document.
UI logic must adapt to data, never the reverse.
