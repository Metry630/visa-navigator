// Checks that every text colour the site actually paints clears WCAG AA against the surface it sits
// on, in both light and dark mode.
//
// The palette is the one thing an identity pass is most likely to quietly break: a colour can look
// right in dark mode, which is the only mode anyone had ever looked at here, and fail in light. So
// this runs before any colour moves and stays in CI afterwards.
//
// It reads the oklch tokens straight out of src/styles.css (:root and .dark) and converts them by
// hand: oklch -> OKLab -> linear sRGB -> 8-bit sRGB -> WCAG relative luminance. That is about thirty
// lines of fixed maths, which is cheaper than a colour library and leaves nothing to interpret.
//
//   npm run check:contrast
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = join(import.meta.dirname, "..", "src", "styles.css");

/** WCAG AA for normal text. Large text (>=24px, or >=18.66px bold) may use LARGE_MIN instead. */
const MIN = 4.5;
const LARGE_MIN = 3;

/**
 * The worst pair measured on 2026-09-20, before the identity pass touched anything: muted text on a
 * muted block in light mode, at 5.58:1. (A hand check the same day put the worst at 5.90:1, muted
 * text on the surface tint; it had not counted the muted block, which is the point of having the
 * pair list in a file rather than in someone's head.)
 *
 * It is recorded as a ratchet so a palette change has to be at least as readable as what it
 * replaces, rather than merely clearing AA. Lowering it is a decision, not a default: move it in the
 * same commit as the palette change, and say why.
 */
const WORST_FLOOR = 5.58;

type Mode = "light" | "dark";

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A text colour, the surface behind it, and why the pair exists. */
interface Pair {
  what: string;
  fg: string;
  bg: string;
  /** Set only for text that is genuinely large on every page it appears on. */
  large?: boolean;
}

// Each pair is a combination the UI really renders. Adding a token to styles.css does not need a
// pair; putting text on it does.
const PAIRS: Pair[] = [
  { what: "body text", fg: "foreground", bg: "background" },
  { what: "body text on the surface tint", fg: "foreground", bg: "surface" },
  { what: "body text on a card", fg: "card-foreground", bg: "card" },
  { what: "muted text", fg: "muted-foreground", bg: "background" },
  { what: "muted text on the surface tint", fg: "muted-foreground", bg: "surface" },
  { what: "muted text on a card", fg: "muted-foreground", bg: "card" },
  { what: "muted text on a muted block", fg: "muted-foreground", bg: "muted" },
  { what: "link", fg: "primary", bg: "background" },
  { what: "link on the surface tint", fg: "primary", bg: "surface" },
  { what: "link on a card", fg: "primary", bg: "card" },
  { what: "primary button label", fg: "primary-foreground", bg: "primary" },
  { what: "secondary button label", fg: "secondary-foreground", bg: "secondary" },
  { what: "accent text", fg: "accent-foreground", bg: "accent" },
  { what: "destructive button label", fg: "destructive-foreground", bg: "destructive" },
  { what: 'badge "Open"', fg: "open-foreground", bg: "open" },
  { what: 'badge "Employer applies for you"', fg: "depends-foreground", bg: "depends" },
  { what: 'badge "Closed"', fg: "closed-foreground", bg: "closed" },
  { what: 'tag "Met"', fg: "open-foreground", bg: "surface" },
  { what: 'tag "Not met"', fg: "closed-foreground", bg: "surface" },
  { what: "popover text", fg: "popover-foreground", bg: "popover" },
];

/** Pulls `--name: value;` out of one CSS block. */
function block(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`${selector} not found in styles.css`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const tokens = new Map<string, string>();
  for (const line of css.slice(open + 1, close).split("\n")) {
    const m = /^\s*--([a-z0-9-]+)\s*:\s*(.+?)\s*;/.exec(line);
    if (m) tokens.set(m[1]!, m[2]!);
  }
  return tokens;
}

/** oklch(L C H) or oklch(L C H / A%), with L and A allowed as percentages. */
function parseOklch(value: string): { l: number; c: number; h: number; a: number } {
  const m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/.exec(value);
  if (!m) throw new Error(`not an oklch colour: ${value}`);
  const pct = (s: string) => (s.endsWith("%") ? Number(s.slice(0, -1)) / 100 : Number(s));
  return { l: pct(m[1]!), c: Number(m[2]), h: Number(m[3]), a: m[4] ? pct(m[4]) : 1 };
}

/** oklch -> OKLab -> linear sRGB. Out-of-gamut components are clipped, as a browser clips them. */
function toLinearSrgb(value: string): Rgb {
  const { l: L, c, h, a } = parseOklch(value);
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);

  const l_ = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;

  const clip = (x: number) => Math.min(1, Math.max(0, x));
  return {
    r: clip(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    g: clip(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    b: clip(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
    a,
  };
}

const encode = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const decode = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);

/** The 8-bit sRGB triple the screen is actually asked to paint. */
function toBytes(rgb: Rgb): [number, number, number] {
  return [rgb.r, rgb.g, rgb.b].map((x) => Math.round(encode(x) * 255)) as [number, number, number];
}

const hex = (rgb: Rgb) =>
  "#" +
  toBytes(rgb)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");

/** Composites a translucent colour over an opaque one, in linear light. */
function over(fg: Rgb, bg: Rgb): Rgb {
  if (fg.a >= 1) return fg;
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = toBytes(rgb).map((v) => decode(v / 255)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg: Rgb, bg: Rgb): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const css = readFileSync(CSS, "utf8");
const light = block(css, ":root {");
const dark = block(css, ".dark {");

// The system-preference block repeats the dark values for readers who never touch the toggle. If the
// two ever disagree, half the audience sees a palette nobody checked.
const preference = block(css, "@media (prefers-color-scheme: dark)");
const errors: string[] = [];
for (const [name, value] of preference) {
  const inDark = dark.get(name);
  if (inDark !== value) {
    errors.push(
      `--${name}: the prefers-color-scheme block says ${value}, .dark says ${inDark ?? "nothing"}`,
    );
  }
}

const rows: { mode: Mode; what: string; fg: string; bg: string; ratio: number; min: number }[] = [];

for (const [mode, tokens] of [
  ["light", light],
  ["dark", dark],
] as const) {
  // .dark only overrides what changes; anything it leaves out falls through to :root.
  const read = (name: string): string => {
    const value = tokens.get(name) ?? light.get(name);
    if (!value) throw new Error(`--${name} is not defined in styles.css`);
    return value;
  };

  const page = toLinearSrgb(read("background"));
  for (const pair of PAIRS) {
    const bg = over(toLinearSrgb(read(pair.bg)), page);
    const fg = over(toLinearSrgb(read(pair.fg)), bg);
    rows.push({
      mode,
      what: pair.what,
      fg: hex(fg),
      bg: hex(bg),
      ratio: ratio(fg, bg),
      min: pair.large ? LARGE_MIN : MIN,
    });
  }
}

const width = Math.max(...rows.map((r) => r.what.length));
for (const row of rows) {
  const pass = row.ratio >= row.min;
  console.log(
    `${pass ? "ok   " : "FAIL "} ${row.mode.padEnd(5)} ${row.what.padEnd(width)}  ` +
      `${row.fg} on ${row.bg}  ${row.ratio.toFixed(2)}:1 (min ${row.min})`,
  );
  if (!pass) {
    errors.push(
      `${row.mode}: ${row.what} is ${row.ratio.toFixed(2)}:1, below the ${row.min}:1 minimum`,
    );
  }
}

const worst = rows.reduce((a, b) => (b.ratio < a.ratio ? b : a));
if (worst.ratio < WORST_FLOOR) {
  errors.push(
    `the worst pair is now ${worst.ratio.toFixed(2)}:1 (${worst.mode}, ${worst.what}), below the ` +
      `recorded floor of ${WORST_FLOOR}:1. If this is a deliberate palette change, move WORST_FLOOR ` +
      `in this file and say why.`,
  );
}

for (const e of errors) console.error(`error ${e}`);
console.log(
  `pairs ${rows.length} · modes 2 · worst ${worst.ratio.toFixed(2)}:1 (${worst.mode}, ${worst.what})` +
    ` · floor ${WORST_FLOOR}:1`,
);
process.exit(errors.length ? 1 : 0);
