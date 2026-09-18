// Everything the review page writes. Kept apart from the server so the risky part, rewriting a
// route file's `verified` stamp, can be tested on a temporary file.
//
//   src/data/<cc>/<route>.json   "verified": { by, on }, and only when every requirement in that
//                                route carries an approval the maintainer pressed in the page.
//                                Any rejection clears the stamp back to null.
//   research/review-notes.md     every rejection and every comment, appended with its date.
//   .review/state.json           which requirements have been approved so far, each with a
//                                fingerprint of what was approved, so a later edit invalidates it
//                                rather than inheriting the approval (gitignored).
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { RouteSchema, type Route } from "../../src/engine/schema";
import type { Note, State } from "./page";
import { fingerprint, isApproved } from "./fingerprint";
import { today } from "../today";

export const ROOT = join(import.meta.dirname, "..", "..");
const DATA = join(ROOT, "src", "data");
const STATE_FILE = join(ROOT, ".review", "state.json");
const NOTES_FILE = join(ROOT, "research", "review-notes.md");

export interface RouteFile {
  file: string;
  route: Route;
}

/** Route files, paired with their path so a stamp can be written back to the right one. */
export function loadRoutes(): RouteFile[] {
  const out: RouteFile[] = [];
  for (const dir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const name of readdirSync(join(DATA, dir.name)).filter((f) => f.endsWith(".json"))) {
      const file = join(DATA, dir.name, name);
      out.push({ file, route: RouteSchema.parse(JSON.parse(readFileSync(file, "utf8"))) });
    }
  }
  return out.sort((a, b) => a.route.id.localeCompare(b.route.id));
}

export function loadState(): State {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
  } catch {
    return {};
  }
}

export function saveState(state: State): void {
  mkdirSync(join(ROOT, ".review"), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}

export function note(by: string, routeId: string, requirementId: string, line: string): void {
  mkdirSync(join(ROOT, "research"), { recursive: true });
  if (!existsSync(NOTES_FILE)) {
    writeFileSync(
      NOTES_FILE,
      "# Review notes\n\nWritten by the review page (`npm run review`). Every rejection and every\ncomment lands here, newest at the bottom.\n\n",
    );
  }
  appendFileSync(NOTES_FILE, `- **${routeId} / ${requirementId}** (${today()}, ${by}) ${line}\n`);
}

/**
 * Rewrites only the top-level "verified" value, so the hand-laid-out route files keep their shape.
 * Route files always carry the key, because the schema requires it.
 */
export function writeVerified(file: string, value: { by: string; on: string } | null): void {
  const text = readFileSync(file, "utf8");
  const pattern = /^(\s*)"verified":\s*(?:null|\{[^{}]*\})/gm;
  const hits = text.match(pattern);
  if (hits?.length !== 1)
    throw new Error(`${file}: expected exactly one "verified" key, found ${hits?.length ?? 0}`);
  const replacement = value
    ? `"verified": { "by": ${JSON.stringify(value.by)}, "on": ${JSON.stringify(value.on)} }`
    : `"verified": null`;
  writeFileSync(
    file,
    text.replace(pattern, (_m, indent: string) => `${indent}${replacement}`),
  );
}

export interface Body {
  routeId?: string;
  requirementId?: string;
  action?: string;
  comment?: string;
}

/**
 * Records one decision and recomputes the route's stamp from scratch. This never approves anything
 * by itself: the stamp appears only when every requirement in the route already carries an approval
 * the maintainer pressed, and any rejection takes it straight back to null.
 */
export function decide(body: Body, by: string): { message: string; verified: Route["verified"] } {
  const { routeId, requirementId, action, comment } = body;
  const entry = loadRoutes().find((r) => r.route.id === routeId);
  if (!entry) throw new Error(`unknown route ${routeId}`);
  const req = entry.route.requirements.find((r) => r.id === requirementId);
  if (!req) throw new Error(`unknown requirement ${requirementId}`);

  const state = loadState();
  const forRoute = (state[entry.route.id] ??= {});
  const existing: Note | undefined = forRoute[req.id];

  if (action === "comment") {
    if (!comment) throw new Error("a comment needs text");
    // A comment is not a verdict: it leaves an earlier approval or rejection exactly as it was.
    forRoute[req.id] = {
      ...(existing?.decision ? { decision: existing.decision } : {}),
      ...(existing?.hash ? { hash: existing.hash } : {}),
      on: today(),
      comments: [...(existing?.comments ?? []), comment],
    };
    note(by, entry.route.id, req.id, `comment: ${comment}`);
  } else if (action === "approve" || action === "reject") {
    forRoute[req.id] = {
      decision: action,
      on: today(),
      comments: [...(existing?.comments ?? []), ...(comment ? [comment] : [])],
      hash: fingerprint(req),
    };
    if (action === "reject")
      note(by, entry.route.id, req.id, `rejected: ${comment ?? "no reason given"}`);
  } else {
    throw new Error(`unknown action ${action}`);
  }
  saveState(state);

  const complete = entry.route.requirements.every((r) => isApproved(forRoute[r.id], r));
  const verified = complete ? { by, on: today() } : null;
  if (JSON.stringify(entry.route.verified) !== JSON.stringify(verified))
    writeVerified(entry.file, verified);

  const message = complete
    ? `${entry.route.id} verified by ${by} on ${verified!.on}`
    : action === "comment"
      ? "comment written to research/review-notes.md"
      : `${req.id} ${action === "approve" ? "approved" : "rejected"}`;
  return { message, verified };
}
