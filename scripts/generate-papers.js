const fs = require("fs");
const path = require("path");

/* ===== CONFIG ===== */
const BASE_DIR = "papers/assam-university/physics";
const MAP_FILE = "maps/physics-paper-map.json";
const OUTPUT_FILE = "data/papers.json";

const UNIVERSITY = "Assam University";
const STREAM = "Science";
const SUBJECT = "Physics";

/* ===== LOAD MAP ===== */
const paperMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));

/* ===== LOAD EXISTING PAPERS ===== */
let existingPapers = [];
if (fs.existsSync(OUTPUT_FILE)) {
  existingPapers = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
}

/* ===== HELPERS ===== */
function parseFilename(filename) {
  // AU-CBCS-PHSHCC201T-2021.pdf
  const clean = filename.replace(".pdf", "");
  const parts = clean.split("-");

  if (parts.length !== 4) return null;

  const [, programme, paperCode, year] = parts;
  return { programme, paperCode, year: parseInt(year) };
}

function alreadyExists(papers, paperCode, year) {
  return papers.some(
    p => p.paper_code === paperCode && p.year === year
  );
}

/* ===== MAIN LOGIC ===== */
const files = fs.readdirSync(BASE_DIR).filter(f => f.endsWith(".pdf"));
const newEntries = [];

for (const file of files) {
  const parsed = parseFilename(file);
  if (!parsed) continue;

  const { programme, paperCode, year } = parsed;
  const meta = paperMap[paperCode];

  if (!meta) {
    console.warn(`⚠️ No map entry for ${paperCode}, skipping`);
    continue;
  }

  if (alreadyExists(existingPapers, paperCode, year)) {
    continue;
  }

  newEntries.push({
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
    tags: meta.tags,
    search_text: `${paperCode} ${meta.paper_name} ${year}`,
    pdf: `${BASE_DIR}/${file}`
  });
}

/* ===== WRITE OUTPUT ===== */
const finalData = [...existingPapers, ...newEntries];
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));

console.log(`✅ Added ${newEntries.length} new paper(s)`);
