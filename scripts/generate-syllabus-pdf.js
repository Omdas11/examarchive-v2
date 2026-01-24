import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const SYLLABUS_ROOT = "data/syllabus";
const OUTPUT_DIR = "assets/pdfs/syllabus";
const TEMPLATE = fs.readFileSync("templates/syllabus.html", "utf8");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getAllJsonFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getAllJsonFiles(full));
    } else if (file.endsWith(".json")) {
      results.push(full);
    }
  }
  return results;
}

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  headless: "new",
});

const page = await browser.newPage();
const files = getAllJsonFiles(SYLLABUS_ROOT);

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  const unitsHtml = data.units
    .map(
      u => `
      <div class="unit">
        <strong>${u.title}</strong>
        <div class="hours">(${u.hours} Hours)</div>
        <p>${u.topics.join(", ")}</p>
      </div>
    `
    )
    .join("");

  const refsHtml = (data.references || [])
    .map(r => `<li>${r}</li>`)
    .join("");

  const html = TEMPLATE
    .replace("{{paper_name}}", data.meta.paper_name)
    .replace("{{paper_code}}", data.meta.paper_code)
    .replace("{{programme}}", data.meta.programme)
    .replace("{{semester}}", data.meta.semester)
    .replace("{{credits}}", data.meta.credits)
    .replace("{{university}}", data.meta.university)
    .replace("{{objectives}}", data.objectives)
    .replace("{{units}}", unitsHtml)
    .replace("{{references}}", refsHtml)
    .replace(
      "{{timestamp}}",
      new Date().toLocaleString("en-IN", { hour12: false })
    );

  await page.setContent(html, { waitUntil: "networkidle0" });

  const outPath = path.join(
    OUTPUT_DIR,
    `${data.meta.paper_code}.pdf`
  );

  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
  });

  console.log("Generated:", outPath);
}

await browser.close();
