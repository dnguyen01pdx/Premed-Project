/**
 * Checks every text/background pairing the design actually uses against
 * WCAG 2.1 AA. Run with `npm run check:contrast`.
 *
 * Values are mirrored from src/app/globals.css. If you change a color there,
 * change it here too, or this check silently passes on stale values.
 */

const C = {
  navy900: "#0a1c3d",
  navy800: "#10294f",
  navy700: "#163566",
  navy100: "#dbe4f7",
  navy50: "#eef3fc",
  background: "#f6f8fc",
  surface: "#ffffff",
  sunken: "#f0f4fa",
  foreground: "#16203a",
  muted: "#55607a",
  accent: "#1d4ed8",
  accentHover: "#1a3fae",
  onAccent: "#ffffff",
  warn: "#8a4b04",
  warnSoft: "#fdf1e0",
  ok: "#14603c",
  okSoft: "#e2f2e9",
  info: "#1c4c8c",
  infoSoft: "#e5eefa",
  neutral: "#4d566b",
  neutralSoft: "#eceff5",
  danger: "#9b1c1c",
  dangerSoft: "#fdeaea",
} as const;

function channel(v: number) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(fg: string, bg: string) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** [label, foreground, background, minimum required] */
const PAIRS: Array<[string, string, string, number]> = [
  // Body text
  ["body text on page", C.foreground, C.background, 4.5],
  ["body text on card", C.foreground, C.surface, 4.5],
  ["body text on sunken", C.foreground, C.sunken, 4.5],
  ["muted text on page", C.muted, C.background, 4.5],
  ["muted text on card", C.muted, C.surface, 4.5],
  ["muted text on sunken", C.muted, C.sunken, 4.5],

  // Links and buttons
  ["link on page", C.accent, C.background, 4.5],
  ["link on card", C.accent, C.surface, 4.5],
  ["link on soft accent", C.accentHover, C.navy50, 4.5],
  ["button label on accent", C.onAccent, C.accent, 4.5],
  ["button label on accent hover", C.onAccent, C.accentHover, 4.5],

  // Navy surfaces (header, footer, hero)
  ["white on navy 900", C.onAccent, C.navy900, 4.5],
  ["white on navy 800", C.onAccent, C.navy800, 4.5],
  ["white on navy 700", C.onAccent, C.navy700, 4.5],
  ["navy100 text on navy 900", C.navy100, C.navy900, 4.5],
  ["navy100 text on navy 800", C.navy100, C.navy800, 4.5],

  // Status badges
  ["warn badge", C.warn, C.warnSoft, 4.5],
  ["ok badge", C.ok, C.okSoft, 4.5],
  ["info badge", C.info, C.infoSoft, 4.5],
  ["neutral badge", C.neutral, C.neutralSoft, 4.5],
  ["danger badge", C.danger, C.dangerSoft, 4.5],

  // Badges also render on white cards
  ["warn badge text on card", C.warn, C.surface, 4.5],
  ["ok badge text on card", C.ok, C.surface, 4.5],
  ["info badge text on card", C.info, C.surface, 4.5],
  ["neutral badge text on card", C.neutral, C.surface, 4.5],
];

let failures = 0;
const rows: string[] = [];

for (const [label, fg, bg, min] of PAIRS) {
  const r = ratio(fg, bg);
  const pass = r >= min;
  if (!pass) failures++;
  rows.push(
    `${pass ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`,
  );
}

console.log(rows.join("\n"));
console.log(
  `\n${PAIRS.length - failures}/${PAIRS.length} pairings meet WCAG AA.`,
);

if (failures > 0) {
  console.error(`\n${failures} contrast failure(s). Fix globals.css.`);
  process.exit(1);
}
