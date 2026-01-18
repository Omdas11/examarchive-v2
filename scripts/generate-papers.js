const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAPERS_DIR = path.join(ROOT, "papers");
const MAPS_DIR = path.join(ROOT, "maps");
const OUTPUT = path.join(ROOT, "data", "papers.json");

// ---------------- Helpers ----------------
function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function walk(dir, out = []) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (f.toLowerCase().endsWith(".pdf")) out.push(full);
  });
  return out;
}

function extractYear(file) {
  const m = file.match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

function normalizeCode(code) {
  return code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

// Base code for grouping AT / BT
function baseVariant(code) {
  // PHYDSC453AT → PHYDSC453
  const m = code.match(/^(.*?)(A|B)T$/);
  return m ? m[1] : code.replace(/T$/, "");
}

// ---------------- Load maps ----------------
function loadMaps() {
  const programmes = ["fyug", "cbcs"];
  const all = [];

  programmes.forEach(pgm => {
    const dir = path.join(MAPS_DIR, pgm);
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(file => {
      if (!file.endsWith(".json")) return;
      const map = readJSON(path.join(dir, file));

      map.papers.forEach(p => {
        all.push({
          ...p,
          subject: map.subject,
          stream: map.stream,
          programme: map.programme
        });
      });
    });
  });

  return all;
}

// ---------------- Generator ----------------
const mapPapers = loadMaps();
const pdfs = walk(PAPERS_DIR);

const grouped = new Map();

/*
Key = programme + subject + baseVariant + year
Value = one question paper (possibly AT/BT)
*/

pdfs.forEach(pdf => {
  const year = extractYear(pdf);
  if (!year) return;

  const name = normalizeCode(path.basename(pdf));

  mapPapers.forEach(mp => {
    const codeNorm = normalizeCode(mp.paper_code);
    if (!name.includes(codeNorm.replace(/T$/, ""))) return;


    const base = baseVariant(mp.paper_code);
    const key = `${mp.programme}|${mp.subject}|${base}|${year}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        university: "Assam University",
        programme: mp.programme,
        stream: mp.stream,
        subject: mp.subject,
        semester: mp.semester,
        course_type: mp.course_type,
        tags: mp.tags || [],
        paper_codes: [],
        paper_names: [],
        year,
        pdf: pdf.replace(ROOT + "/", "")
      });
    }

    const entry = grouped.get(key);

    if (!entry.paper_codes.includes(mp.paper_code)) {
      entry.paper_codes.push(mp.paper_code);
      entry.paper_names.push(mp.paper_name);
    }
  });
});

// ---------------- Output ----------------
const output = Array.from(grouped.values()).sort(
  (a, b) => b.year - a.year
);

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`✔ Generated ${output.length} question papers`);
