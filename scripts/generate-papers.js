const fs = require("fs");
const path = require("path");

const PAPERS_ROOT = "papers/assam-university";
const OUTPUT = "data/papers.json";

const result = [];

/* ===============================
   Helpers
================================ */
function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  });
}

function extractYear(file) {
  const m = file.match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

/* ===============================
   Scan papers
================================ */
walk(PAPERS_ROOT, file => {
  if (!file.endsWith(".pdf")) return;

  // Expected:
  // papers/assam-university/{programme}/{subject}/FILE.pdf
  const parts = file.split(path.sep);

  const university = "Assam University";
  const programme = parts[2]?.toUpperCase(); // fyug / cbcs
  const subject = parts[3]?.toLowerCase();   // physics / commerce
  const filename = parts.at(-1);

  if (!programme || !subject) return;

  const year = extractYear(filename);
  if (!year) return;

  // Example filename:
  // AU-CBCS-PHSHCC201T-2023.pdf
  const codeMatch = filename.match(/([A-Z]{2,}[A-Z0-9]+T)/);
  if (!codeMatch) return;

  const paperCode = codeMatch[1];

  result.push({
    university,
    programme: programme === "FYUG" ? "FYUG" : "CBCS",
    subject,
    paper_codes: [paperCode],
    paper_names: [],
    semester: null,
    stream: subject === "commerce" ? "commerce" : "science",
    pdf: `/examarchive-v2/${file.replace(/\\/g, "/")}`,
    year
  });
});

/* ===============================
   Write output
================================ */
fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
console.log(`✔ Generated ${result.length} papers`);
