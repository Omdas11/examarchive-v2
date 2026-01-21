const fs = require("fs");
const path = require("path");

/* ===============================
   Helpers
================================ */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
  console.log("Moved:", src, "→", dest);
}

/* ===============================
   1. PAPERS (already worked)
================================ */
const PAPERS_ROOT = "papers/assam-university";

["physics", "commerce"].forEach(subject => {
  const baseDir = path.join(PAPERS_ROOT, subject);
  if (!fs.existsSync(baseDir)) return;

  fs.readdirSync(baseDir).forEach(file => {
    if (!file.endsWith(".pdf")) return;

    const src = path.join(baseDir, file);

    if (file.includes("CBCS")) {
      moveFile(src, path.join(PAPERS_ROOT, "cbcs", subject, file));
    }

    if (file.includes("FYUG")) {
      moveFile(src, path.join(PAPERS_ROOT, "fyug", subject, file));
    }
  });
});

/* ===============================
   2. SYLLABUS
================================ */
const SYLLABUS_ROOT = "data/syllabus/assam-university";

["physics", "chemistry", "commerce"].forEach(subject => {
  ["fyug", "cbcs"].forEach(programme => {
    const oldDir = path.join(SYLLABUS_ROOT, subject, programme);
    if (!fs.existsSync(oldDir)) return;

    fs.readdirSync(oldDir).forEach(file => {
      if (!file.endsWith(".json")) return;

      const src = path.join(oldDir, file);
      const dest = path.join(SYLLABUS_ROOT, programme, subject, file);
      moveFile(src, dest);
    });
  });
});

/* ===============================
   3. REPEATED QUESTIONS
================================ */
const RQ_ROOT = "data/repeated-questions/assam-university";

["physics"].forEach(subject => {
  ["fyug", "cbcs"].forEach(programme => {
    const oldDir = path.join(RQ_ROOT, subject, programme);
    if (!fs.existsSync(oldDir)) return;

    fs.readdirSync(oldDir).forEach(file => {
      if (!file.endsWith(".json")) return;

      const src = path.join(oldDir, file);
      const dest = path.join(RQ_ROOT, programme, subject, file);
      moveFile(src, dest);
    });
  });
});

console.log("✔ Reorganization completed");
