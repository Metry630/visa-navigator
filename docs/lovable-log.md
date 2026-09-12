# Lovable log

Every message sent to the Lovable agent, what it cost and what it changed. Stream U keeps this.
Pro Lite gives no monthly credits, so the budget is what is left of the 300 one-time credits plus 5 a day.

| Date | Credits | Commit | What |
|---|---|---|---|
| 2026-09-12 | 1.3 | `6f1ea19` | Plan for the four-part UI batch. The agent paused for plan approval rather than editing. |
| 2026-09-12 | 3.0 | `61571d0` | The batch: "Retrieved" instead of "Checked" on source lines, footer and home trust line reworded, dates rendered as 1 Jan 2027 through one helper, methodology source link pointed at the repo, 375px pass over /check and /results. |
| 2026-09-12 | 0.7 | `92b90d4` | Ran `bun install` so `bun.lock` matched `package.json` and CI stopped failing at the install step, plus the repeated home trust sentence. |

**Spent so far: 5.0.** 303 were left on 2026-09-11, so about 298 remain against a v0 budget of ~150.

Notes that save credits:

- Batch several changes into one message. The four-part batch cost 3.0 for what would have been four messages.
- The agent may answer a request with a plan and stop. That first turn still costs, so say "do all of this in
  one turn" in the request itself.
- Put durable rules in project knowledge instead of repeating them per message. The "Retrieved versus
  Checked" rule is in there now, so it should not have to be asked for again.
