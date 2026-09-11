# Stream U: the UI, through Lovable

**Runs from** the main folder (`~/kerjaan/lovable/visa-navigator`), with no worktree. Only one U session at
a time, because Lovable commits straight to `main`.

**How.**
1. `git pull`, then read `src/engine/types.ts` so every request only uses what the engine provides.
2. Send one batched request with the Lovable MCP (`send_message`, project
   `e24dc628-aae5-421c-99fa-969c29510ffb`). Lovable's project knowledge already holds the ownership, data and
   copy rules.
3. Review the change with `get_diff` before anything builds on it: no hardcoded visa facts, no edits to
   engine / data / scripts, the copy rules, and obvious smells (long components, duplicated logic, needless
   re-renders).
4. `git pull`, then `npm test` and `npm run typecheck`. If Lovable broke something, ask it to fix it in the
   same thread.

**Budget.** About 150 credits for v0; 303 were left on 2026-09-11. Batch requests, and log each message's
cost in `docs/lovable-log.md`.

**Queue.** The "What Lovable should do" list in `docs/START-HERE.md`.

**Publishing** to lovable.app happens only after `npm run check:data -- --release` passes.
