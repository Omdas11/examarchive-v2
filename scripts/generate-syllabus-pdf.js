import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const SYLLABUS_ROOT = "data/syllabus";
const OUTPUT_ROOT = "assets/pdfs/syllabus";

function collectJsonFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

(async () => {
  console.log("🚀 Starting syllabus PDF generator");

  const files = collectJsonFiles(SYLLABUS_ROOT);
  console.log(`📚 Found ${files.length} syllabus files`);

  if (!files.length) return;

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new"
  });

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const code = data?.meta?.code || path.basename(file, ".json");

    const outDir = OUTPUT_ROOT;
    const outFile = path.join(outDir, `${code}.pdf`);
    fs.mkdirSync(outDir, { recursive: true });

    const html = `
      <html>
        <body style="font-family:Arial;padding:40px">
          <h1>${data.meta.title}</h1>
          <p><b>Code:</b> ${data.meta.code}</p>
          <p><b>University:</b> ${data.meta.university}</p>
          <h2>Units</h2>
          ${(data.units || []).map(u => `
            <p><b>${u.title}</b> (${u.hours} hrs)</p>
            <p>${(u.topics || []).join(", ")}</p>
          `).join("")}
        </body>
      </html>
    `;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: outFile, format: "A4" });
    await page.close();

    console.log(`✅ Generated ${outFile}`);
  }

  await browser.close();
  console.log("🎉 All PDFs generated");
})();
