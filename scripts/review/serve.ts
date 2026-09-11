// The review page: a local server the maintainer uses to check every requirement against its
// sources, one key press at a time. Local only. It binds to 127.0.0.1, it is never built or
// deployed with the app, and it is the only thing that may write a route's `verified` stamp.
//
//   npm run review                 # http://127.0.0.1:4178
//   npm run review -- --by joshua --port 4178
//
// What it writes is in store.ts. It never approves anything by itself: approvals only ever come
// from a POST this page made in response to a key press, and a route with one unapproved
// requirement stays unverified.
import { createServer } from "node:http";
import { renderPage } from "./page";
import { decide, loadRoutes, loadState, type Body } from "./store";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}
const by = arg("by", "joshua");
const port = Number(arg("port", "4178"));

const server = createServer((req, res) => {
  const url = req.url ?? "/";
  if (req.method === "GET" && (url === "/" || url.startsWith("/?"))) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      renderPage(
        loadRoutes().map((r) => r.route),
        loadState(),
        by,
      ),
    );
    return;
  }
  if (req.method === "POST" && url === "/api/decision") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) req.destroy();
    });
    req.on("end", () => {
      try {
        const result = decide(JSON.parse(raw) as Body, by);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
      }
    });
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

server.listen(port, "127.0.0.1", () => {
  const routes = loadRoutes();
  const reqs = routes.reduce((n, r) => n + r.route.requirements.length, 0);
  console.log(`review page: http://127.0.0.1:${port}`);
  console.log(`${routes.length} routes · ${reqs} requirements · stamping as "${by}"`);
});
