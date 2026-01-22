/**
 * ExamArchive v2 — Papers JSON Generator
 * FINAL STABLE VERSION (LOCK THIS)
 * ✔ Correct regex groups
 * ✔ Full paper code preserved
 * ✔ No null / broken entries
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAPERS_DIR = path.join(ROOT, "papers");
const MAPS_DIR = path.join(ROOT, "maps");
const OUTPUT = path.join(ROOT, "data", "papers.json");

/* ---------------- Utils ---------------- */

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (item.endsWith(".pdf")) files.push(full);
  }
  return files;
}

function loadMaps() {
  const maps = [];
  (function walkMaps(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) walkMaps(full);
      else if (item.endsWith(".json")) {
        maps.push(JSON.parse(fs.readFileSync(full, "utf8")));
      }
    }
  })(MAPS_DIR);
  return maps;
}

/* ---------------- Main ---------------- */

const pdfFiles = walk(PAPERS_DIR);
const maps = loadMaps();
const output = [];

for (const pdfPath of pdfFiles) {
  const file = path.basename(pdfPath);
  let matched = false;

  for (const map of maps) {
    const regex = new RegExp(map.code_pattern);
    const match = file.match(regex);
    if (!match) continue;

    // ✅ CORRECT GROUPS
    const paperCode = match[1];   // full code with T / AT / BT
    const year = Number(match[2]);

    const paperInfo = map.papers.find(
      p => p.paper_code === paperCode
    );

    if (!paperInfo) {
      console.warn(`⚠️ Unmapped paper code: ${paperCode}`);
      break;
    }

    output.push({
      university: "Assam University",
      programme: map.programme,
      subject: map.subject,
      stream: map.stream,
      level: map.level,
      paper_codes: [paperCode],
      paper_names: [paperInfo.paper_name],
      semester: paperInfo.semester,
      course_type: paperInfo.course_type,
      tags: paperInfo.tags ?? [],
      pdf: `/examarchive-v2/${path
        .relative(ROOT, pdfPath)
        .replace(/\\/g, "/")}`,
      year
    });

    matched = true;
    break;
  }

  // 🚫 HARD BLOCK — no ghost entries
  if (!matched) {
    console.warn(`❌ No map matched for: ${file}`);
  }
}

/* ---------------- Write ---------------- */

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

console.log(`✔ Generated papers.json (${output.length} papers)`);
