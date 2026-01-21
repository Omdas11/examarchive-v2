import fs from "fs";
import path from "path";

const ROOT = "papers/assam-university";

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Move file safely
function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
  console.log("Moved:", src, "→", dest);
}

// Scan subject folders
["physics", "commerce"].forEach(subject => {
  const baseDir = path.join(ROOT, subject);
  if (!fs.existsSync(baseDir)) return;

  fs.readdirSync(baseDir).forEach(file => {
    if (!file.endsWith(".pdf")) return;

    const src = path.join(baseDir, file);

    // Detect programme from filename
    if (file.includes("CBCS")) {
      const dest = path.join(
        ROOT,
        "cbcs",
        subject,
        file
      );
      moveFile(src, dest);
    }

    if (file.includes("FYUG")) {
      const dest = path.join(
        ROOT,
        "fyug",
        subject,
        file
      );
      moveFile(src, dest);
    }
  });
});
