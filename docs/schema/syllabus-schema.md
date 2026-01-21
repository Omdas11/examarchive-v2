# ExamArchive – Syllabus JSON Schema (LOCKED)

This document defines the canonical syllabus JSON schema used across ExamArchive.

⚠️ This schema is LOCKED.
Existing fields MUST NOT be removed or renamed.
New fields may be added only in a backward-compatible manner.

File path (recommended):
docs/schema/syllabus.schema.md

================================================================

FILE LOCATION CONVENTION

data/syllabus/{university}/{subject}/{programme}/{paper_code}.json

Example:
data/syllabus/assam-university/physics/fyug/PHYDSC101T.json

================================================================

ROOT STRUCTURE

Each syllabus JSON MUST follow this structure:

- meta (required)
- objectives (optional)
- units (required)
- lectures (optional)
- learning_outcomes (optional)
- references (optional)

Empty arrays and objects are allowed and encouraged for future use.

================================================================

META OBJECT (REQUIRED)

"meta": {
  "university": "Assam University",
  "programme": "FYUG",
  "stream": "Science",
  "subject": "Physics",
  "paper_code": "PHYDSC101T",
  "paper_name": "Mathematical Physics – I",
  "semester": 1,
  "course_type": "DSC",
  "nature": "Theory",
  "credits": 3,
  "contact_hours": 45,
  "last_updated": "YYYY-MM-DD"
}

Rules:
- paper_code must exactly match papers.json
- semester must be a number
- nature ∈ Theory | Practical | Project
- last_updated uses ISO format

================================================================

OBJECTIVES (OPTIONAL)

"objectives": [
  "To introduce mathematical tools required for physics",
  "To develop problem-solving skills in physical systems"
]

================================================================

UNITS (REQUIRED)

"units": [
  {
    "unit_no": 1,
    "title": "Vector Algebra and Matrices",
    "hours": 9,
    "topics": [
      "Scalar and vector products",
      "Eigenvalues and eigenvectors"
    ]
  }
]

Rules:
- unit_no must be an integer
- topics must be an array of strings
- No Roman numerals in unit names

================================================================

LECTURES (OPTIONAL – FUTURE READY)

"lectures": [
  {
    "lecture_no": 1,
    "title": "Introduction to Vectors",
    "unit_no": 1,
    "description": "Basic idea of vectors and physical interpretation",
    "resources": []
  }
]

Rules:
- lecture_no must be an integer
- unit_no must reference an existing unit
- resources is always an array

================================================================

LEARNING OUTCOMES (OPTIONAL)

"learning_outcomes": [
  "Apply vector calculus to physical problems",
  "Solve differential equations used in physics"
]

================================================================

REFERENCES (OPTIONAL)

"references": {
  "textbooks": [],
  "additional_reading": [],
  "online_resources": []
}

================================================================

DESIGN PRINCIPLES

- JSON contains data only (no HTML or Markdown inside JSON)
- UI formatting is handled separately
- Empty fields are allowed
- Backward compatibility is mandatory

================================================================

SCHEMA STATUS

Version: v1.0
Status: LOCKED
Locked on: 2026-01-21
