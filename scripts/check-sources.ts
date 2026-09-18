// Drift check: every quote must still be on its live page. Official pages change without notice,
// so this runs weekly in CI and before any route is verified.
//
// Sources marked `"check": "manual"` are skipped. Those are PDFs and JavaScript-rendered pages the
// fetcher can't read as text; a person re-reads them when the route is next verified.
//
// A moved quote and an unreachable page are not the same finding, and this used to exit 1 for both.
// A moved quote means the rule may have changed and a person has to re-read it. An unreachable page
// means we could not tell, which is often the publisher rate-limiting us and often over within days:
// MOFA refused this fetcher for six days in September 2026 and then stopped. Failing the weekly run
// for that trains everyone to ignore it, and the issue it opened said quotes had moved when none had.
// So only a moved quote is a failure; unreachable pages are reported and exit 0.
//
//   npm run check:sources
//   npm run check:sources -- --json .sources/last-check.json   # also write the counts for the README
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { RouteSchema } from "../src/engine/schema";
import { fetchPage, htmlToLines, normalise } from "./page-text";
import { today } from "./today";

const DATA = join(import.meta.dirname, "..", "src", "data");
const jsonFlag = process.argv.indexOf("--json");
const jsonOut = jsonFlag === -1 ? null : process.argv[jsonFlag + 1];
const pages = new Map<string, string | Error>();
const missing: string[] = [];
const unreachable: string[] = [];
const skipped: string[] = [];
let found = 0;

for (const dir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const name of readdirSync(join(DATA, dir.name)).filter((f) => f.endsWith(".json"))) {
    const route = RouteSchema.parse(JSON.parse(readFileSync(join(DATA, dir.name, name), "utf8")));
    for (const req of route.requirements) {
      for (const s of req.sources) {
        const where = `${route.id}#${req.id}`;
        if (s.check === "manual") {
          skipped.push(`${where}: ${s.url}`);
          continue;
        }
        if (!pages.has(s.url)) {
          try {
            pages.set(s.url, normalise(htmlToLines(await fetchPage(s.url)).join(" ")));
          } catch (e) {
            pages.set(s.url, e instanceof Error ? e : new Error(String(e)));
          }
        }
        const page = pages.get(s.url);
        if (page instanceof Error) unreachable.push(`${where}: ${page.message}`);
        else if (page?.includes(normalise(s.quote))) found++;
        else missing.push(`${where}: "${s.quote.slice(0, 80)}" is no longer on ${s.url}`);
      }
    }
  }
}

for (const m of missing) console.error(`missing     ${m}`);
for (const u of unreachable) console.error(`unreachable ${u}`);
for (const s of skipped) console.log(`skipped     ${s}`);
const checked = found + missing.length + unreachable.length;
const line = `quotes live ${found}/${checked} · pages fetched ${pages.size} · skipped (manual) ${skipped.length}`;
console.log(line);
// Machine-readable, so CI can tell the two findings apart without parsing the prose above.
console.log(`result moved=${missing.length} unreachable=${unreachable.length} skipped=${skipped.length} live=${found}`);
if (unreachable.length && !missing.length) {
  console.log(
    `note: ${unreachable.length} quote(s) could not be checked because their page did not answer. ` +
      `That is not drift, and no quote has moved. If it is still failing next week, re-read those ` +
      `pages by hand or mark them "check": "manual".`,
  );
}

if (jsonOut) {
  mkdirSync(dirname(jsonOut), { recursive: true });
  writeFileSync(
    jsonOut,
    JSON.stringify(
      {
        on: today(),
        found,
        checked,
        missing: missing.length,
        unreachable: unreachable.length,
        skipped: skipped.length,
      },
      null,
      2,
    ) + "\n",
  );
}

process.exit(missing.length ? 1 : 0);
