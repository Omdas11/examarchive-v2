# ExamArchive v2 — Maps JSON Schema

This document defines the canonical schema for all map files located inside the
`maps/` directory. These files are consumed by `scripts/generate-papers.js`
to generate `data/papers.json`.

Maps provide static academic metadata and act as the single source of truth
for paper identity and classification.

────────────────────────────────────────────
1. PURPOSE OF MAP FILES
────────────────────────────────────────────

Each map file represents:
- ONE subject
- UNDER ONE programme (CBCS or FYUG)

Maps define:
- Valid paper codes
- Paper names
- Semester numbers
- Course types
- Tags

Maps do NOT define:
- PDF paths
- Exam year
- University name

Those are resolved dynamically by the generator.

────────────────────────────────────────────
2. REQUIRED DIRECTORY STRUCTURE
────────────────────────────────────────────

All maps MUST follow this structure exactly:

maps/
├── cbcs/
│   ├── physics.json
│   ├── chemistry.json
│   └── commerce.json
└── fyug/
    ├── physics.json
    └── chemistry.json

The generator recursively loads ALL `.json` files under `maps/`.

Legacy files such as:
- maps/physics_cbcs.json
- maps/physics_fyug.json

MUST NOT be used and should be deleted.

────────────────────────────────────────────
3. MAP FILE ROOT SCHEMA
────────────────────────────────────────────

Each map file MUST be a valid JSON object with the following keys:

{
  "subject": string,
  "programme": string,
  "stream": string,
  "level": string,
  "code_pattern": string,
  "papers": array
}

Field meanings:

- subject  
  Lowercase subject name  
  Examples: "physics", "chemistry", "commerce"

- programme  
  Programme identifier  
  Allowed values: "CBCS", "FYUG"

- stream  
  Academic stream  
  Examples: "science", "commerce", "arts"

- level  
  Academic level  
  Currently fixed as: "UG"

- code_pattern  
  Regular expression string used to match PDF filenames  
  MUST capture:
    Group 1 → paper code WITHOUT year
    Group 2 → year (4 digits)

- papers  
  Array of paper metadata objects

────────────────────────────────────────────
4. PAPER OBJECT SCHEMA
────────────────────────────────────────────

Each object inside the `papers` array MUST follow this schema:

{
  "paper_code": string,
  "paper_name": string,
  "semester": number,
  "course_type": string,
  "tags": array
}

Field meanings:

- paper_code  
  Exact paper code WITHOUT year  
  Examples:
    PHYDSC101T
    PHSHCC201T
    PHSDSE502T
    PHYDSC453AT

- paper_name  
  Official paper title as per syllabus

- semester  
  Integer semester number (1–8)

- course_type  
  Course classification  
  Examples:
    DSC, DSM, SEC, DSE, HCC, AEC, VAC, AEC

- tags  
  Array of lowercase keyword strings  
  Used for search and filtering

────────────────────────────────────────────
5. CODE PATTERN RULES (CRITICAL)
────────────────────────────────────────────

The `code_pattern` MUST:

1. Match the full PDF filename
2. Capture the paper code (without year)
3. Capture the year separately

Example (FYUG Physics):

^AU-FYUG-(PHYDSC\\d{3}[AB]?T)-(\\d{4})\\.pdf$

Example (CBCS Physics):

^AU-CBCS-(PHS[A-Z]{3}\\d{3}[AB]?T)-(\\d{4})\\.pdf$

If the regex does not match:
- The paper will be skipped
- Metadata will be null
- Generator may throw an error

────────────────────────────────────────────
6. GENERATOR EXPECTATIONS
────────────────────────────────────────────

The generator assumes:

- map.papers EXISTS and is an array
- paper_code values EXACTLY match regex group 1
- No year is present inside paper_code
- Tags may be empty but MUST exist

Invalid maps WILL cause:
- unmapped paper warnings
- null metadata
- generator crashes

────────────────────────────────────────────
7. DESIGN DECISIONS (LOCKED)
────────────────────────────────────────────

- Maps are array-based (NOT object-based)
- No nesting by semester
- No duplication of year
- No PDF paths inside maps
- One paper entry per unique paper code

Any future extension must remain backward compatible
with this schema.

────────────────────────────────────────────
END OF MAPS SCHEMA
────────────────────────────────────────────
