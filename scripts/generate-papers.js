/**
 * ExamArchive v2 – Papers Generator
 * FINAL, FILENAME-TOLERANT VERSION
 * OVERWRITE-ONLY, MOBILE-SAFE
 */

const fs = require("fs");
const path = require("path");

// ================================
// Helpers
// ================================
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function exists(p) {
  return fs.existsSync(p);
}

function normalize(str) {
  return String(str).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ================================
// Paths
// ================================
const ROOT = path.join(__dirname, "..");
const PAPERS_DIR = path.join(ROOT, "papers");
const MAPS_DIR = path.join(ROOT, "maps");
const REGISTRY_DIR = path.join(ROOT, "data", "registry");
const OUTPUT = path.join(ROOT, "data", "papers.json");

// ================================
// Load registries
// ================================
const streams = readJSON(path.join(REGISTRY_DIR, "streams.json"));
const subjects = readJSON(path.join(REGISTRY_DIR, "subjects.json"));
const programmes = readJSON(path.join(REGISTRY_DIR, "programmes.json"));

// ================================
// Discover maps
// ================================
function getMapFiles() {
  const files = [];

  ["fyug", "cbcs"].forEach(dir => {
    const p = path.join(MAPS_DIR, dir);
    if (!exists(p)) return;
    fs.readdirSync(p).forEach(f => {
      if (f.endsWith(".json")) files.push(path.join(p, f));
    });
  });

  fs.readdirSync(MAPS_DIR).forEach(f => {
    if (f.endsWith(".json")) files.push(path.join(MAPS_DIR, f));
  });

  return files;
}

// ================================
// Load maps
// ================================
const maps = getMapFiles().map(file => readJSON(file));

// ================================
// Collect PDFs
// ================================
const pdfs = [];

function walk(dir) {
  fs.readdirSync(dir).forEach(item => {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (item.toLowerCase().endsWith(".pdf")) pdfs.push(full);
  });
}

walk(PAPERS_DIR);

// ================================
// Generate papers.json
// ================================
const output = [];

pdfs.forEach(file => {
  const filenameNorm = normalize(path.basename(file));

  maps.forEach(map => {
    if (!map.paper_code_patterns) return;

    map.paper_code_patterns.forEach(pattern => {
      const codeNorm = normalize(pattern.replace(/#/g, ""));

      if (filenameNorm.includes(codeNorm.slice(0, 6))) {
        const codeMatch = filenameNorm.match(/[A-Z]{3,}[0-9]{3}[A-Z]?/);
        if (!codeMatch) return;

        const code = codeMatch[0];

        output.push({
          university: map.university || "assam-university",
          programme: map.programme || "",
          stream: map.stream || "",
          subject: map.subject || "",
          paper_code: code,
          paper_name: map.paper_name_map?.[code] || code,
          pdf: file.replace(ROOT + "/", "")
        });
      }
    });
  });
});

// ================================
// Write output
// ================================
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`✔ Generated ${output.length} papers`);
