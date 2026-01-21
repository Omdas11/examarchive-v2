const fs = require("fs");
const path = require("path");

const ROOT = "papers/assam-university";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
  console.log("Moved:", src, "→", dest);
}

["physics", "commerce"].forEach(subject => {
  const baseDir = path.join(ROOT, subject);
  if (!fs.existsSync(baseDir)) return;

  fs.readdirSync(baseDir).forEach(file => {
    if (!file.endsWith(".pdf")) return;

    const src = path.join(baseDir, file);

    if (file.includes("CBCS")) {
      const dest = path.join(ROOT, "cbcs", subject, file);
      moveFile(src, dest);
    }

    if (file.includes("FYUG")) {
      const dest = path.join(ROOT, "fyug", subject, file);
      moveFile(src, dest);
    }
  });
});
