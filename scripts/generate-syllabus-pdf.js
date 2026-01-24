import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const ROOT = process.cwd();
const SYLLABUS_DIR = path.join(ROOT, "data", "syllabus");
const OUTPUT_DIR = path.join(ROOT, "assets", "pdfs", "syllabus");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function findJsonFiles(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      res.push(...findJsonFiles(full));
    } else if (f.endsWith(".json")) {
      res.push(full);
    }
  }
  return res;
}

(async () => {
  console.log("🚀 Generating syllabus PDFs");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const files = findJsonFiles(SYLLABUS_DIR);

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const code = data.meta.paper_code;

    for (const mode of ["paragraph", "list"]) {
      const html = `
        <html>
        <body style="font-family: Times New Roman; margin:60px">
          <h1 style="text-align:center">${data.meta.paper_name}</h1>
          <p style="text-align:center"><strong>${data.meta.university}</strong></p>
          <p style="text-align:center">
            ${data.meta.programme} · Semester ${data.meta.semester} · Credits ${data.meta.credits}
          </p>
          <hr/>
          ${data.units.map(u => `
            <h3>Unit ${u.unit_no}: ${u.title}</h3>
            ${
              mode === "list"
                ? "<ul>" + u.topics.map(t => `<li>☐ ${t}</li>`).join("") + "</ul>"
                : `<p>${u.topics.join(", ")}</p>`
            }
          `).join("")}
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: "load" });

      const out = path.join(OUTPUT_DIR, `${code}-${mode}.pdf`);
      await page.pdf({ path: out, format: "A4" });

      console.log("✓", path.basename(out));
    }
  }

  await browser.close();
  console.log("🎉 Done");
})();
