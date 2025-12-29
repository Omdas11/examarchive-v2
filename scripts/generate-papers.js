/**
 * ExamArchive v2 – Paper Generator
 * Assam University | Physics | UG
 * Auto-adds level: "UG"
 */

const fs = require("fs");
const path = require("path");

// ===== CONFIG =====
const UNIVERSITY = "Assam University";
const LEVEL = "UG";
const STREAM = "Science";
const SUBJECT = "Physics";

const PAPERS_DIR = path.join(
  __dirname,
  "..",
  "papers",
  "assam-university",
  "physics"
);

const OUTPUT_FILE = path.join(
  __dirname,
  "..",
  "data",
  "papers.json"
);

// Programme maps
const CBCS_MAP = require("./maps/physics_cbcs.json");
const FYUG_MAP = require("./maps/physics_fyug.json");

// ===== HELPERS =====

function detectProgramme(filename) {
  if (filename.includes("FYUG")) return "FYUG";
  if (filename.includes("CBCS")) return "CBCS";
  return null;
}

function extractYear(filename) {
  const match = filename.match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

function extractPaperCode(filename) {
  const match = filename.match(/(PH[A-Z0-9]+T)/);
  return match ? match[1] : null;
}

function buildSearchText(paper) {
  return [
    paper.paper_code,
    paper.paper_name,
    paper.programme,
    paper.subject,
    paper.year,
    paper.semester
  ]
    .join(" ")
    .toLowerCase();
}

// ===== MAIN =====

function generate() {
  if (!fs.existsSync(PAPERS_DIR)) {
    console.error("❌ Papers directory not found:", PAPERS_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(PAPERS_DIR)
    .filter(f => f.endsWith(".pdf"));

  const papers = [];

  for (const file of files) {
    const programme = detectProgramme(file);
    if (!programme) continue;

    const year = extractYear(file);
    const paperCode = extractPaperCode(file);
    if (!year || !paperCode) continue;

    const map =
      programme === "FYUG" ? FYUG_MAP : CBCS_MAP;

    const meta = map[paperCode];
    if (!meta) continue;

    const paper = {
      university: UNIVERSITY,
      level: LEVEL,                 // 🔑 FUTURE-PROOF
      programme: programme,
      stream: STREAM,
      subject: SUBJECT,

      semester: meta.semester,
      paper_code: paperCode,
      paper_name: meta.paper_name,

      year: year,
      exam_type: "End Semester",

      tags: [
        programme,
        SUBJECT,
        `Semester ${meta.semester}`,
        paperCode
      ],

      search_text: "",
      pdf: `papers/assam-university/physics/${file}`
    };

    paper.search_text = buildSearchText(paper);
    papers.push(paper);
  }

  // Sort: latest year first
  papers.sort((a, b) => b.year - a.year);

  // Ensure output dir exists
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(papers, null, 2),
    "utf-8"
  );

  console.log(`✅ Generated ${papers.length} UG papers`);
}

// ===== RUN =====
generate();
