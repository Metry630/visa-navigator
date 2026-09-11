// Drift check: every quote must still be on its live page. Official pages change without notice,
// so this runs weekly in CI and before any route is verified.
//
//   npm run check:sources
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RouteSchema } from "../src/engine/schema";
import { fetchPage, htmlToLines, normalise } from "./page-text";

const DATA = join(import.meta.dirname, "..", "src", "data");
const pages = new Map<string, string | Error>();
const missing: string[] = [];
const unreachable: string[] = [];
let found = 0;

for (const dir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const name of readdirSync(join(DATA, dir.name)).filter((f) => f.endsWith(".json"))) {
    const route = RouteSchema.parse(JSON.parse(readFileSync(join(DATA, dir.name, name), "utf8")));
    for (const req of route.requirements) {
      for (const s of req.sources) {
        if (!pages.has(s.url)) {
          try {
            pages.set(s.url, normalise(htmlToLines(await fetchPage(s.url)).join(" ")));
          } catch (e) {
            pages.set(s.url, e instanceof Error ? e : new Error(String(e)));
          }
        }
        const page = pages.get(s.url);
        const where = `${route.id}#${req.id}`;
        if (page instanceof Error) unreachable.push(`${where}: ${page.message}`);
        else if (page?.includes(normalise(s.quote))) found++;
        else missing.push(`${where}: "${s.quote.slice(0, 80)}" is no longer on ${s.url}`);
      }
    }
  }
}

for (const m of missing) console.error(`missing     ${m}`);
for (const u of unreachable) console.error(`unreachable ${u}`);
console.log(`quotes live ${found}/${found + missing.length + unreachable.length} · pages fetched ${pages.size}`);
process.exit(missing.length || unreachable.length ? 1 : 0);
