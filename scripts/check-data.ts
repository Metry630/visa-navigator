// Checks every route file in src/data before it can merge:
//   1. schema: parses against RouteSchema, ids are unique, currencies match the destination
//   2. grounding: every number a user sees (rule text, route summary, salary tables) appears in a quote
//   3. verification: reported; with --release, every route must carry a person's stamp
// The live-page drift check is stream C's job (scripts/check-sources.ts).
//
//   npm run check:data              # development: unverified routes are warnings
//   npm run check:data -- --release # before publishing: unverified routes are errors
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RouteSchema, type Route } from "../src/engine/schema";

const DATA = join(import.meta.dirname, "..", "src", "data");
const release = process.argv.includes("--release");
const STALE_DAYS = 90;
const errors: string[] = [];
const warnings: string[] = [];

/** Numbers as digit strings, so "S$5,600" and "$5,600" both become "5600". */
function numbers(text: string): string[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, ""));
}

const routes: { file: string; route: Route }[] = [];
for (const dir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const name of readdirSync(join(DATA, dir.name)).filter((f) => f.endsWith(".json"))) {
    const file = `${dir.name}/${name}`;
    const parsed = RouteSchema.safeParse(JSON.parse(readFileSync(join(DATA, file), "utf8")));
    if (!parsed.success) {
      errors.push(`${file}: schema: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    } else {
      routes.push({ file, route: parsed.data });
    }
  }
}

const seen = new Set<string>();
for (const { file, route } of routes) {
  if (seen.has(route.id)) errors.push(`${file}: duplicate route id ${route.id}`);
  seen.add(route.id);
  if (!file.startsWith(route.destination.toLowerCase() + "/")) errors.push(`${file}: folder doesn't match destination ${route.destination}`);

  const routeQuoted = new Set(route.requirements.flatMap((q) => q.sources.flatMap((s) => numbers(s.quote))));
  for (const n of numbers(route.summary)) {
    if (!routeQuoted.has(n)) errors.push(`${file}: summary: ${n} is not in any quote`);
  }

  const reqIds = new Set<string>();
  for (const req of route.requirements) {
    const where = `${file}#${req.id}`;
    if (reqIds.has(req.id)) errors.push(`${where}: duplicate requirement id`);
    reqIds.add(req.id);

    const quoted = new Set(req.sources.flatMap((s) => numbers(s.quote)));
    for (const n of numbers(req.text)) {
      if (!quoted.has(n)) errors.push(`${where}: text: ${n} is not in any of its quotes`);
    }
    if (req.kind === "salary-floor") {
      const expected = route.destination === "SG" ? ["SGD", "month"] : ["JPY", "year"];
      if (req.currency !== expected[0] || req.period !== expected[1]) {
        errors.push(`${where}: ${route.destination} salaries must be ${expected.join(" per ")}`);
      }
      for (const row of req.byAge) {
        if (!quoted.has(String(row.amount))) errors.push(`${where}: salary table: ${row.amount} is not in any quote`);
        if (!quoted.has(String(row.age))) errors.push(`${where}: salary table: age ${row.age} is not in any quote`);
      }
      const ages = req.byAge.map((r) => r.age);
      if (ages.some((a, i) => i > 0 && a <= ages[i - 1])) errors.push(`${where}: salary table rows must be sorted by age`);
    }
  }

  if (!route.verified) {
    (release ? errors : warnings).push(`${file}: not yet verified by a person`);
  } else if ((Date.now() - Date.parse(route.verified.on)) / 86_400_000 > STALE_DAYS) {
    warnings.push(`${file}: last verified ${route.verified.on}, over ${STALE_DAYS} days ago`);
  }
}

const reqs = routes.flatMap((r) => r.route.requirements);
const verified = routes.filter((r) => r.route.verified);
const oldest = verified.map((r) => r.route.verified!.on).sort()[0] ?? "none";
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(
  `routes ${routes.length} · requirements ${reqs.length} · sourced ${reqs.filter((q) => q.sources.length).length}/${reqs.length}` +
    ` · verified ${verified.length}/${routes.length} · oldest verification ${oldest}`,
);
process.exit(errors.length ? 1 : 0);
