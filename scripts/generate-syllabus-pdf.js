// trigger workflow
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const outDir = "assets/pdfs/syllabus";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();

// TEMP hardcoded data (just to prove pipeline)
const html = `
<html>
  <body style="font-family: serif; padding: 40px">
    <h1>TEST SYLLABUS PDF</h1>
    <p>If you see this file, GitHub Actions PDF works.</p>
  </body>
</html>
`;

await page.setContent(html);
await page.pdf({
  path: `${outDir}/TEST.pdf`,
  format: "A4",
  printBackground: true,
});

await browser.close();
