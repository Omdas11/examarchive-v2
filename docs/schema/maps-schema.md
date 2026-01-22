# ExamArchive v2 — Maps JSON Schema (LOCKED)

This document defines the canonical and locked schema for all maps/*.json files
used by ExamArchive-v2.

Changing this schema affects:
- scripts/generate-papers.js
- data/papers.json
- Browse page rendering
- Paper page routing

Modify only with full understanding.

----------------------------------------------------------------

1. PURPOSE OF MAPS

Maps provide the authoritative registry that links:
- PDF filenames
- Paper codes
- Paper names
- Semester
- Course type
- Tags

Generator workflow:
1. Scan PDFs in /papers/**
2. Match filename using code_pattern
3. Extract paper_code and year
4. Enrich metadata from papers[]
5. Generate data/papers.json

----------------------------------------------------------------

2. FILE LOCATION RULES

Each map file represents ONE subject + ONE programme.

Directory structure:

maps/
  fyug/
    physics.json
    chemistry.json
  cbcs/
    physics.json
    commerce.json

Do NOT mix subjects or programmes in a single file.

----------------------------------------------------------------

3. TOP-LEVEL JSON SCHEMA

Required structure:

{
  "subject": "physics | chemistry | commerce | ...",
  "programme": "FYUG | CBCS",
  "stream": "science | commerce | arts",
  "level": "UG | PG",
  "code_pattern": "REGEX STRING",
  "papers": []
}

Field meanings:
- subject: lowercase, used in paths
- programme: FYUG or CBCS
- stream: academic stream
- level: UG or PG
- code_pattern: filename parsing regex
- papers: array of paper definitions

----------------------------------------------------------------

4. CODE_PATTERN RULES (CRITICAL)

The generator assumes EXACTLY THREE CAPTURE GROUPS.

Group meanings:
- match[1] → base paper code
- match[2] → suffix (T, AT, BT, P)
- match[3] → year

STRICT RULE:
Do NOT put optional tokens inside the same capture group as the base paper code.
Always separate suffixes into their own capture group.

----------------------------------------------------------------

5. VALID CODE_PATTERN EXAMPLES

FYUG Physics (A/B supported):
^AU-FYUG-(PHYDSC\\d{3})([AB]?T)-(\\d{4})\\.pdf$

Matches:
- PHYDSC101T
- PHYDSC453AT
- PHYDSC453BT

FYUG Chemistry (Theory + Practical):
^AU-FYUG-(CHM[A-Z]{3}\\d{3})([AB]?T|P)-(\\d{4})\\.pdf$

Matches:
- CHMDSC101T
- CHMDSC152P
- CHMDSC253P

CBCS Physics:
^AU-CBCS-(PHS[A-Z]{3}\\d{3})([AB]?T)-(\\d{4})\\.pdf$

CBCS Commerce:
^AU-CBCS-(COM[A-Z]{3}\\d{3})([AB]?T)-(\\d{4})\\.pdf$

----------------------------------------------------------------

6. PAPERS ARRAY SCHEMA

Each object represents ONE logical paper (not year-wise).

{
  "paper_code": "PHYDSC101T",
  "paper_name": "Mathematical Physics - I",
  "semester": 1,
  "course_type": "DSC | HCC | DSE | SEC | AEC | DSM | GEN | LAN",
  "tags": ["search", "keywords"]
}

Field meanings:
- paper_code: must match extracted code
- paper_name: display name
- semester: integer
- course_type: academic category
- tags: optional lowercase keywords

----------------------------------------------------------------

7. GENERATOR DEPENDENCY (LOCKED)

Generator must reconstruct paper code like this:

paperCode = match[1] + match[2]
year = Number(match[3])

If capture groups change, generator MUST be updated.

----------------------------------------------------------------

8. DESIGN PRINCIPLES (DO NOT BREAK)

- One map = one subject + one programme
- Regex must be explicit and predictable
- No year data inside papers[]
- No semester guessing in generator
- Maps are the single source of truth

----------------------------------------------------------------

9. STATUS

Schema locked
All current maps aligned
Future-proof for A/B, theory, and practical papers
