// Saves an official page as plain text in .sources/<name>.txt (gitignored), so quotes can be copied
// from what the page actually says rather than from a model's summary of it.
//
//   npx tsx scripts/fetch-source.ts mom-ep-eligibility https://www.mom.gov.sg/passes-and-permits/employment-pass/eligibility
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchPage, htmlToLines } from "./page-text";
import { today } from "./today";

const [name, url] = process.argv.slice(2);
if (!name || !url) {
  console.error("usage: npx tsx scripts/fetch-source.ts <name> <url>");
  process.exit(1);
}

const dir = join(import.meta.dirname, "..", ".sources");
mkdirSync(dir, { recursive: true });
const lines = htmlToLines(await fetchPage(url));
writeFileSync(
  join(dir, `${name}.txt`),
  [`# ${url}`, `# retrieved ${today()}`, ...lines].join("\n") + "\n",
);
console.log(`.sources/${name}.txt: ${lines.length} lines`);
