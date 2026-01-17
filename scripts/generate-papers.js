/**
 * ExamArchive v2 – Papers Generator (Registry-aware)
 * SAFE OVERWRITE VERSION
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
// Discover map files
// (new structure first, legacy fallback)
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
// Load & validate maps
// ================================
const maps = getMapFiles().map(file => {
  const map = readJSON(file);

  if (map.subject && !subjects[map.subject]) {
    throw new Error(`Unknown subject in map: ${file}`);
  }
  if (map.stream && !streams[map.stream]) {
    throw new Error(`Unknown stream in map: ${file}`);
  }
  if (map.programme && !programmes[map.programme]) {
    throw new Error(`Unknown programme in map: ${file}`);
  }

  return map;
});

// ================================
// Collect PDFs
// ================================
const pdfs = [];

function walk(dir) {
  fs.readdirSync(dir).forEach(item => {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (item.endsWith(".pdf")) pdfs.push(full);
  });
}

walk(PAPERS_DIR);

// ================================
// Generate papers.json
// (LOGIC KEPT SIMPLE + STABLE)
// ================================
const output = [];

pdfs.forEach(file => {
  const name = path.basename(file);

  maps.forEach(map => {
    if (!map.paper_code_patterns) return;

    map.paper_code_patterns.forEach(pattern => {
      const regex = new RegExp("^" + pattern.replace(/#/g, "\\d") + ".*\\.pdf$");

      if (regex.test(name)) {
        const code = name.match(/[A-Z]{3,}[0-9]{3}[A-Z]?/)[0];

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
console.log("✔ papers.json generated safely");
