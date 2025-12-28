const fs = require("fs");
const path = require("path");

/* ================= CONFIG ================= */

const BASE_DIR = "papers/assam-university/physics";
const OUTPUT_FILE = "data/papers.json";

const MAP_FILES = {
  CBCS: "maps/physics_cbcs.json",
  FYUG: "maps/physics_fyug.json"
};

const UNIVERSITY = "Assam University";
const STREAM = "Science";
const SUBJECT = "Physics";

/* ================= LOAD EXISTING PAPERS ================= */

let existingPapers = [];
if (fs.existsSync(OUTPUT_FILE)) {
  existingPapers = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
}

/* ================= HELPERS ================= */

function parseFilename(filename) {
  // Example: AU-CBCS-PHSHCC201T-2021.pdf
  const clean = filename.replace(".pdf", "");
  const parts = clean.split("-");

  if (parts.length !== 4) return null;

  const [, programme, paperCode, year] = parts;

  return {
    programme,
    paperCode,
    year: parseInt(year, 10)
  };
}

function loadPaperMap(programme) {
  const mapPath = MAP_FILES[programme];
  if (!mapPath || !fs.existsSync(mapPath)) {
    console.warn(`⚠️ Map file missing for programme: ${programme}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(mapPath, "utf-8"));
}

function alreadyExists(papers, programme, paperCode, year) {
  return papers.some(
    p =>
      p.programme === programme &&
      p.paper_code === paperCode &&
      p.year === year
  );
}

/* ================= MAIN ================= */

if (!fs.existsSync(BASE_DIR)) {
  console.error("❌ Physics papers directory not found:", BASE_DIR);
  process.exit(1);
}

const pdfFiles = fs.readdirSync(BASE_DIR).filter(f => f.endsWith(".pdf"));
let addedCount = 0;

for (const file of pdfFiles) {
  const parsed = parseFilename(file);
  if (!parsed) continue;

  const { programme, paperCode, year } = parsed;
  const paperMap = loadPaperMap(programme);

  if (!paperMap || !paperMap[paperCode]) {
    console.warn(`⚠️ Missing map entry for ${paperCode} (${programme})`);
    continue;
  }

  if (alreadyExists(existingPapers, programme, paperCode, year)) {
    continue;
  }

  const meta = paperMap[paperCode];

  existingPapers.push({
    university: UNIVERSITY,
    programme: programme,
    stream: STREAM,
    subject: SUBJECT,
    course_type: meta.course_type,
    semester: meta.semester,
    paper_code: paperCode,
    paper_name: meta.paper_name,
    year: year,
    exam_type: "End Semester",
    tags: meta.tags || [],
    search_text: `${paperCode} ${meta.paper_name} ${year}`,
    pdf: `${BASE_DIR}/${file}`
  });

  addedCount++;
}

/* ================= WRITE OUTPUT ================= */

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingPapers, null, 2));

console.log(`✅ Papers added: ${addedCount}`);
