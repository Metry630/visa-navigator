// The review page's HTML. Local only: it is rendered by scripts/review/serve.ts and never shipped
// with the app. The interaction follows benchmark/relabel_2026.py in claude-spam: one focused item
// at a time, the evidence next to the claim, numbers highlighted, and the whole flow on the keyboard.
//
// The page shows what the data says and what the source says. It decides nothing. Every approval is
// a key the maintainer pressed, and only a route whose every requirement carries one gets stamped.
import type { Requirement, Route } from "../../src/engine/schema";
import { numbers, splitOnNumbers, toAsciiDigits } from "../numbers";
import { isApproved, isStale } from "./fingerprint";

export type Decision = "approve" | "reject";
export interface Note {
  /** Undefined when the maintainer has only left a comment so far. */
  decision?: Decision;
  on: string;
  comments: string[];
  /**
   * `fingerprint()` of the requirement as it read when the decision was made. An approval whose
   * hash no longer matches the file is not an approval: see fingerprint.ts for why.
   */
  hash?: string;
}
export type State = Record<string, Record<string, Note>>;

const esc = (s: string): string =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );

/**
 * Wraps every number in <mark>. A number that also appears on the other side of the comparison is
 * marked "same", so a figure in the requirement text that is missing from the quotes (or a figure in
 * a quote that the text changed) stands out instead of blending in. Full-width digits are marked
 * too, and against their ASCII form, so a Japanese quote lines up with an English sentence.
 */
function markNumbers(text: string, shared: Set<string>): string {
  return splitOnNumbers(text)
    .map((part, i) => {
      if (i % 2 === 0) return esc(part);
      const plain = toAsciiDigits(part).replace(/,/g, "");
      return `<mark class="${shared.has(plain) ? "same" : "only"}">${esc(part)}</mark>`;
    })
    .join("");
}

function whoLabel(who: Requirement["who"]): string {
  return { you: "you check", employer: "the employer checks", authority: "the authority decides" }[
    who
  ];
}

function effectiveLabel(req: Requirement): string {
  const e = req.effective;
  if (!e?.from && !e?.to) return "always in effect";
  if (e.from && e.to) return `in effect ${e.from} to ${e.to}`;
  return e.from ? `in effect from ${e.from}` : `in effect until ${e.to}`;
}

function renderRequirement(route: Route, req: Requirement, note: Note | undefined): string {
  const quoted = new Set(req.sources.flatMap((s) => numbers(s.quote)));
  // Every number this requirement puts in front of a user: the sentence, and the salary table too,
  // so a figure in a quote that nothing in the data uses is the one that stands out.
  const shown = new Set([
    ...numbers(req.text),
    ...(req.kind === "salary-floor"
      ? req.byAge.flatMap((r) => [String(r.age), String(r.amount)])
      : []),
  ]);
  const stale = isStale(note, req);
  const cls = ["req", stale ? "stale" : (note?.decision ?? "")].filter(Boolean).join(" ");

  const quotes = req.sources
    .map(
      (s) => `<figure class="quote">
  <blockquote>${markNumbers(s.quote, shown)}</blockquote>
${s.translation ? `  <blockquote class="translation" lang="en">${markNumbers(s.translation, shown)}</blockquote>` : ""}
  <figcaption>${esc(s.publisher)} · retrieved ${esc(s.retrievedOn)}${s.check === "manual" ? " · not auto-checked" : ""}${s.translation ? " · unofficial translation" : ""}
    <button class="open" data-url="${esc(s.url)}">Open source</button>
  </figcaption>
</figure>`,
    )
    .join("\n");

  let table = "";
  if (req.kind === "salary-floor") {
    const rows = req.byAge
      .map(
        (r) =>
          `<tr><td>${markNumbers(String(r.age), quoted)}</td><td>${markNumbers(r.amount.toLocaleString("en-SG"), quoted)}</td></tr>`,
      )
      .join("");
    table = `<table class="salary"><caption>${esc(req.currency)} per ${esc(req.period)} · ${esc(req.sector)}</caption>
      <thead><tr><th>age</th><th>minimum</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  const comments = (note?.comments ?? []).map((c) => `<li>${esc(c)}</li>`).join("");

  return `<article class="${cls}" data-route="${esc(route.id)}" data-req="${esc(req.id)}" tabindex="-1">
  <header>
    <span class="id">${esc(req.id)}</span>
    <span class="tags">${esc(req.kind)} · ${esc(whoLabel(req.who))} · ${req.blocking ? "blocking" : "not blocking"} · ${esc(effectiveLabel(req))}</span>
    <span class="verdict"></span>
  </header>
  ${stale ? `<p class="staleness">Changed since you approved it on ${esc(note!.on)}. Read it again.</p>` : ""}
  <p class="text">${markNumbers(req.text, quoted)}</p>
  ${table}
  ${quotes}
  <ul class="comments">${comments}</ul>
  <div class="actions">
    <button data-act="approve">A — approve</button>
    <button data-act="reject">R — reject</button>
    <button data-act="comment">C — comment</button>
  </div>
</article>`;
}

function renderRoute(route: Route, state: State): string {
  const notes = state[route.id] ?? {};
  const approved = route.requirements.filter((r) => isApproved(notes[r.id], r)).length;
  const stamp = route.verified
    ? `verified by ${esc(route.verified.by)} on ${esc(route.verified.on)}`
    : "not yet verified";
  return `<section class="route" data-route="${esc(route.id)}">
  <h2>${esc(route.name)} <span class="rid">${esc(route.id)}</span></h2>
  <p class="summary">${esc(route.summary)}</p>
  <p class="meta">
    <span class="progress" data-total="${route.requirements.length}">${approved} / ${route.requirements.length} approved</span>
    <span class="stamp">${stamp}</span>
    <button class="open" data-url="${esc(route.officialUrl)}">Open the official page</button>
  </p>
  ${route.requirements.map((req) => renderRequirement(route, req, notes[req.id])).join("\n")}
</section>`;
}

export function renderPage(routes: Route[], state: State, by: string): string {
  return `<!doctype html>
<meta charset="utf-8">
<title>Review — Visa Routes</title>
<style>
 :root{--ok:#2e7d32;--no:#c62828;--line:#e3e3e0;--bg:#f6f6f4;--ink:#191919;}
 *{box-sizing:border-box}
 body{font-family:-apple-system,system-ui,sans-serif;margin:0;background:var(--bg);color:var(--ink);line-height:1.5}
 #bar{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--line);
      padding:.6rem 1rem;display:flex;gap:1rem;align-items:center;font-size:.9rem}
 #bar b{font-weight:600}
 #bar .who{margin-left:auto;color:#666}
 main{max-width:60rem;margin:0 auto;padding:1rem 1rem 12rem}
 .legend{background:#fff;border:1px solid var(--line);border-radius:8px;padding:.7rem 1rem;margin:1rem 0;font-size:.88rem}
 kbd{background:#f0f0ee;border:1px solid #d5d5d2;border-bottom-width:2px;border-radius:4px;padding:0 .35rem;font-size:.82em}
 .route{margin:2rem 0}
 .route h2{font-size:1.15rem;margin:0 0 .2rem}
 .rid{font-weight:400;color:#999;font-size:.8rem}
 .summary{margin:.2rem 0;color:#444;font-size:.92rem}
 .meta{display:flex;gap:1rem;align-items:center;font-size:.85rem;color:#555;margin:.4rem 0 1rem}
 .stamp{color:#8a6d00}
 .route.complete .stamp{color:var(--ok);font-weight:600}
 .req{background:#fff;border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;
      padding:.8rem 1rem;margin:.8rem 0;outline:none}
 .req:focus{border-color:#1a73e8;border-left-color:#1a73e8;box-shadow:0 0 0 3px #1a73e822}
 .req.approve{border-left-color:var(--ok)}
 .req.reject{border-left-color:var(--no)}
 .req>header{display:flex;gap:.6rem;align-items:baseline;font-size:.78rem;color:#777;flex-wrap:wrap}
 .req .id{font-weight:600;color:#444}
 .req .verdict{margin-left:auto;font-weight:600}
 .req.approve .verdict::after{content:"approved";color:var(--ok)}
 .req.stale{border-left-color:#c98a00}
 .req.stale .verdict::after{content:"needs re-reading";color:#c98a00}
 .staleness{font-size:.82rem;color:#8a5f00;background:#fff6e0;border:1px solid #f0d89a;border-radius:4px;padding:.35rem .6rem;margin:.4rem 0}
 .req.reject .verdict::after{content:"rejected";color:var(--no)}
 .text{font-size:1rem;margin:.5rem 0 .8rem}
 .quote{margin:.6rem 0;border-left:3px solid #e0e0dc;padding:.1rem .8rem}
 .quote blockquote{margin:0;font-size:.9rem;white-space:pre-wrap}
 .quote blockquote.translation{margin-top:.4rem;padding-top:.4rem;border-top:1px dotted #d5d5d0;color:#555;font-style:italic}
 .quote figcaption{font-size:.76rem;color:#888;margin-top:.3rem;display:flex;gap:.5rem;align-items:center}
 mark{padding:0 .12em;border-radius:2px;background:#fff3a3}
 mark.same{background:#dcf0dc}
 mark.only{background:#ffd9a8}
 table.salary{border-collapse:collapse;font-size:.8rem;margin:.4rem 0 .8rem}
 table.salary caption{text-align:left;color:#888;font-size:.76rem;padding-bottom:.2rem}
 table.salary th,table.salary td{border:1px solid var(--line);padding:.1rem .5rem;text-align:right}
 .comments{margin:.4rem 0;padding-left:1.1rem;font-size:.85rem;color:#7a5b00}
 .comments:empty{display:none}
 .actions{display:flex;gap:.4rem;margin-top:.6rem}
 button{border:1.5px solid #d5d5d2;background:#fff;border-radius:6px;padding:.25rem .7rem;
        font-size:.82rem;font-weight:600;color:#555;cursor:pointer;font-family:inherit}
 button:hover{background:#fafaf8}
 .req.approve [data-act="approve"]{background:var(--ok);border-color:var(--ok);color:#fff}
 .req.reject [data-act="reject"]{background:var(--no);border-color:var(--no);color:#fff}
 .open{font-weight:400;font-size:.76rem;padding:.1rem .5rem}
</style>
<div id="bar">
  <b id="count"></b>
  <span id="saved"></span>
  <span class="who">stamping as <b>${esc(by)}</b> · notes go to research/review-notes.md</span>
</div>
<main>
<h1>Does each rule say what its source says?</h1>
<div class="legend">
Read the rule, then read its quotes. Approve only when the rule is what the official page says, the
numbers match, and who has to check it is right. Highlighted numbers:
<mark class="same">green</mark> appears on both sides, <mark class="only">amber</mark> appears on one
side only, so look at it twice.<br>
Keys: <kbd>J</kbd>/<kbd>K</kbd> move · <kbd>A</kbd> approve · <kbd>R</kbd> reject · <kbd>C</kbd> comment.
A route is stamped <b>verified</b> only once every one of its requirements is approved. Rejections and
comments are written to <code>research/review-notes.md</code>.
</div>
${routes.map((r) => renderRoute(r, state)).join("\n")}
</main>
<script>
const reqs = [...document.querySelectorAll(".req")];
let cur = 0;

function focusReq(i) {
  if (i < 0 || i >= reqs.length) return;
  cur = i;
  reqs[cur].focus({ preventScroll: true });
  reqs[cur].scrollIntoView({ block: "center", behavior: "smooth" });
}

function refresh() {
  const done = reqs.filter((r) => r.classList.contains("approve")).length;
  document.getElementById("count").textContent = done + " / " + reqs.length + " requirements approved";
  document.querySelectorAll(".route").forEach((sec) => {
    const rs = [...sec.querySelectorAll(".req")];
    const ok = rs.filter((r) => r.classList.contains("approve")).length;
    sec.querySelector(".progress").textContent = ok + " / " + rs.length + " approved";
    sec.classList.toggle("complete", ok === rs.length);
  });
}

function say(text) {
  const el = document.getElementById("saved");
  el.textContent = text;
  clearTimeout(say.t);
  say.t = setTimeout(() => (el.textContent = ""), 4000);
}

async function send(el, act, comment) {
  const body = { routeId: el.dataset.route, requirementId: el.dataset.req, action: act };
  if (comment) body.comment = comment;
  const res = await fetch("/api/decision", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) { say("not saved: " + (data.error || res.status)); return; }
  if (act !== "comment") {
    el.classList.toggle("approve", act === "approve");
    el.classList.toggle("reject", act === "reject");
  }
  if (comment) {
    const li = document.createElement("li");
    li.textContent = comment;
    el.querySelector(".comments").appendChild(li);
  }
  const sec = el.closest(".route");
  sec.querySelector(".stamp").textContent = data.verified
    ? "verified by " + data.verified.by + " on " + data.verified.on
    : "not yet verified";
  say(data.message);
  refresh();
  if (act === "approve") focusReq(cur + 1);
}

function comment(el) {
  const text = prompt("Comment on " + el.dataset.req + " (goes to research/review-notes.md)");
  if (text && text.trim()) send(el, "comment", text.trim());
}

// Rejecting always asks why: a rejection with no reason tells the next session nothing.
function reject(el) {
  const text = prompt("Why is " + el.dataset.req + " wrong? (goes to research/review-notes.md)");
  if (text === null) return;
  send(el, "reject", text.trim() || "no reason given");
}

reqs.forEach((el, i) => {
  el.addEventListener("focus", () => (cur = i));
  el.addEventListener("mousedown", () => (cur = i));
  el.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = () => {
      cur = i;
      if (b.dataset.act === "approve") send(el, "approve");
      else if (b.dataset.act === "reject") reject(el);
      else comment(el);
    };
  });
});
document.querySelectorAll("button.open").forEach((b) => {
  b.onclick = () => window.open(b.dataset.url, "_blank", "noopener");
});
document.addEventListener("keydown", (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const k = ev.key.toLowerCase();
  if (k === "j") { focusReq(cur + 1); ev.preventDefault(); }
  else if (k === "k") { focusReq(cur - 1); ev.preventDefault(); }
  else if (k === "a") { send(reqs[cur], "approve"); ev.preventDefault(); }
  else if (k === "r") { reject(reqs[cur]); ev.preventDefault(); }
  else if (k === "c") { comment(reqs[cur]); ev.preventDefault(); }
});
refresh();
focusReq(0);
</script>
`;
}
