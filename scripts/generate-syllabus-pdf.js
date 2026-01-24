import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const SYLLABUS_ROOT = "data/syllabus";
const OUTPUT_DIR = "assets/pdfs/syllabus";

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else if (f.endsWith(".json")) out.push(p);
  }
  return out;
}

function renderUnits(units, list) {
  return units.map(u => `
    <h3>${u.title} (${u.hours} Hours)</h3>
    ${
      list
        ? `<ul>${u.topics.map(t => `<li>☐ ${t}</li>`).join("")}</ul>`
        : `<p>${u.topics.join(", ")}</p>`
    }
  `).join("");
}

function html(data, list) {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: serif; margin: 48px; }
header { text-align: center; }
footer {
  position: fixed;
  bottom: 20px;
  width: 100%;
  text-align: center;
  font-size: 10px;
}
ul { list-style: none; padding-left: 0; }
li { margin: 4px 0; }
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
${renderUnits(data.units || [], list)}

<h2>REFERENCES</h2>
<ol>${(data.references || []).map(r => `<li>${r}</li>`).join("")}</ol>

<footer>
  ExamArchive · Page <span class="pageNumber"></span> / <span class="totalPages"></span>
</footer>

</body>
</html>`;
}

(async () => {
  console.log("🚀 Generating PDFs");

  const files = walk(SYLLABUS_ROOT);
  if (!files.length) {
    console.log("⚠ No syllabus found");
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: puppeteer.executablePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf8"));
    const code = data.paper_code;

    for (const mode of ["paragraph", "list"]) {
      await page.setContent(html(data, mode === "list"), { waitUntil: "networkidle0" });

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
