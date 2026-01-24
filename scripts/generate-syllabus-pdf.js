import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const SYLLABUS_ROOT = "data/syllabus";
const OUTPUT_DIR = "assets/pdfs/syllabus";

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      results = results.concat(walk(p));
    } else if (file.endsWith(".json")) {
      results.push(p);
    }
  }
  return results;
}

function renderUnits(units, listMode) {
  return units.map(u => `
    <h3>${u.title} (${u.hours} Hours)</h3>
    ${
      listMode
        ? `<ul>${u.topics.map(t => `<li>☐ ${t}</li>`).join("")}</ul>`
        : `<p>${u.topics.join(", ")}</p>`
    }
  `).join("");
}

function buildHTML(data, listMode) {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: serif; margin: 50px; }
header { text-align: center; }
footer {
  position: fixed;
  bottom: 20px;
  width: 100%;
  text-align: center;
  font-size: 10px;
}
ul { list-style: none; padding-left: 0; }
li { margin: 6px 0; }
hr { margin: 20px 0; }
</style>
</head>
<body>

<header>
  <h1>${data.paper_name}</h1>
  <strong>${data.paper_code}</strong><br>
  <strong>${data.university}</strong>
</header>

<hr>

<h2>OBJECTIVES</h2>
<p>${data.objectives || ""}</p>

<h2>COURSE CONTENT</h2>
${renderUnits(data.units || [], listMode)}

<h2>REFERENCES</h2>
<ol>${(data.references || []).map(r => `<li>${r}</li>`).join("")}</ol>

<footer>
  ExamArchive · Page <span class="pageNumber"></span> of <span class="totalPages"></span>
</footer>

</body>
</html>`;
}

(async () => {
  console.log("🚀 Generating PDFs");

  const syllabusFiles = walk(SYLLABUS_ROOT);
  if (!syllabusFiles.length) {
    console.log("⚠ No syllabus JSON found");
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  for (const file of syllabusFiles) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const code = data.paper_code || "UNKNOWN";

    for (const mode of ["paragraph", "list"]) {
      await page.setContent(buildHTML(data, mode === "list"), {
        waitUntil: "networkidle0"
      });

      await page.pdf({
        path: `${OUTPUT_DIR}/${code}-${mode}.pdf`,
        format: "A4",
        printBackground: true,
        margin: { top: "60px", bottom: "60px" }
      });

      console.log(`✓ ${code}-${mode}.pdf`);
    }
  }

  await browser.close();
})();
