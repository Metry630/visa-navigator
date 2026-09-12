// Regenerates the coverage block in README.md between the METRICS markers, from the data and from
// the last drift check. Numbers in the README go stale silently otherwise, and a stale trust claim
// is worse than none.
//
//   npm run readme:metrics            # rewrite the block
//   npm run readme:metrics -- --check # fail if the block is out of date (no writes)
//
// "quotes live" comes from the last `npm run check:sources -- --json .sources/last-check.json`.
// .sources/ is gitignored, so without a recent run that line says so rather than guessing.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import { RouteSchema, type Route } from "../src/engine/schema";

const ROOT = join(import.meta.dirname, "..");
const DATA = join(ROOT, "src", "data");
const README = join(ROOT, "README.md");
const LAST_CHECK = join(ROOT, ".sources", "last-check.json");
const BEGIN = "<!-- METRICS:BEGIN -->";
const END = "<!-- METRICS:END -->";
const check = process.argv.includes("--check");

const routes: Route[] = [];
for (const dir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const name of readdirSync(join(DATA, dir.name)).filter((f) => f.endsWith(".json"))) {
    routes.push(RouteSchema.parse(JSON.parse(readFileSync(join(DATA, dir.name, name), "utf8"))));
  }
}

function pct(part: number, whole: number): string {
  return whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;
}

const reqs = routes.flatMap((r) => r.requirements);
const sourced = reqs.filter((r) => r.sources.length > 0).length;
const verified = routes.filter((r) => r.verified);
const oldest = verified.map((r) => r.verified!.on).sort()[0];
const destinations = [...new Set(routes.map((r) => r.destination))].sort();

let live = "not checked yet (run `npm run check:sources -- --json .sources/last-check.json`)";
if (existsSync(LAST_CHECK)) {
  const last = JSON.parse(readFileSync(LAST_CHECK, "utf8")) as {
    on: string;
    found: number;
    checked: number;
    skipped: number;
    unreachable: number;
  };
  const skipped = last.skipped ? `, ${last.skipped} checked by hand` : "";
  // Unreachable is not drift. A publisher blocking the fetcher would otherwise read here as
  // "21 quotes have moved", which is a much worse claim than the true one.
  const unreachable = last.unreachable
    ? `, ${last.unreachable} unreachable because the publisher is blocking the fetcher`
    : "";
  const denominator = last.checked - (last.unreachable ?? 0);
  live = `${last.found} of ${denominator} still on their official page${skipped}${unreachable}, last checked ${last.on}`;
}

const block = [
  BEGIN,
  "| | |",
  "|---|---|",
  `| Routes covered | ${routes.length} across ${destinations.length} destination${destinations.length === 1 ? "" : "s"} (${destinations.join(", ")}) |`,
  `| Requirements with an official source | ${sourced} of ${reqs.length} (${pct(sourced, reqs.length)}) |`,
  `| Routes verified by a person | ${verified.length} of ${routes.length} (${pct(verified.length, routes.length)}) |`,
  `| Quotes live | ${live} |`,
  `| Oldest verification | ${oldest ?? "none yet"} |`,
  END,
].join("\n");

const text = readFileSync(README, "utf8");
const from = text.indexOf(BEGIN);
const to = text.indexOf(END);
if (from === -1 || to === -1) {
  console.error(`README.md: ${BEGIN} ... ${END} markers are missing`);
  process.exit(1);
}
const updated = text.slice(0, from) + block + text.slice(to + END.length);

if (check) {
  if (updated !== text) {
    console.error("README.md coverage block is out of date. Run: npm run readme:metrics");
    process.exit(1);
  }
  console.log("README.md coverage block is up to date");
} else {
  if (updated !== text) writeFileSync(README, updated);
  console.log(updated.slice(from, from + block.length));
}
