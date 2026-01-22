/**
 * ExamArchive v2 — Papers JSON Generator
 * FINAL STABLE VERSION
 * Supports array-based maps (FYUG / CBCS)
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
  function walkMaps(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) walkMaps(full);
      else if (item.endsWith(".json")) {
        maps.push(JSON.parse(fs.readFileSync(full, "utf8")));
      }
    }
  }
  walkMaps(MAPS_DIR);
  return maps;
}

/* ---------------- Main ---------------- */

const pdfFiles = walk(PAPERS_DIR);
const maps = loadMaps();
const output = [];

for (const pdfPath of pdfFiles) {
  const file = path.basename(pdfPath);

  for (const map of maps) {
    const match = file.match(new RegExp(map.code_pattern));
    if (!match) continue;

    const paperCode = match[1] + match[2];
    const year = Number(match[3]);

    // 🔑 FIX: array-based lookup
    const paperInfo = map.papers.find(
      p => p.paper_code === paperCode
    );

    const entry = {
      university: "Assam University",
      programme: map.programme,
      subject: map.subject,
      stream: map.stream,
      level: map.level,
      paper_codes: [paperCode],
      paper_names: paperInfo ? [paperInfo.paper_name] : [],
      semester: paperInfo?.semester ?? null,
      course_type: paperInfo?.course_type ?? null,
      tags: paperInfo?.tags ?? [],
      pdf: `/examarchive-v2/${path.relative(ROOT, pdfPath).replace(/\\/g, "/")}`,
      year
    };

    output.push(entry);
    break;
  }
}

/* ---------------- Write ---------------- */

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

console.log(`✔ Generated papers.json (${output.length} papers)`);
