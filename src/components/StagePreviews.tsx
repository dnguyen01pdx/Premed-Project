import { Badge, OutlineBadge } from "./Badge";

/**
 * Homepage stage previews.
 *
 * These replaced full-page screenshots. A screenshot of a whole page, shrunk
 * into a card, puts text at about five pixels: blurry on every screen, and
 * stale the moment the UI changes. These are built from the same tokens and
 * components as the real app, so they are sharp at any size, follow every
 * design change automatically, and cost no image bytes.
 *
 * Each one shows the single thing that stage does best, with believable
 * sample data, rather than a miniature of the whole page. They are
 * illustrations: aria-hidden, with the stage's text carrying the meaning.
 */

function Frame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none overflow-hidden rounded-xl border border-line bg-background select-none"
    >
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
        <span className="font-display text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">Example</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------- planner -- */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
// Hours shown: 9 AM to 5 PM. Blocks are placed in hour units from 9.
const BLOCKS: Array<{
  day: number;
  start: number;
  len: number;
  title: string;
  cls: string;
}> = [
  { day: 0, start: 1, len: 1.5, title: "Orgo II", cls: "bg-cat-class-soft text-cat-class border-cat-class/25" },
  { day: 2, start: 1, len: 1.5, title: "Orgo II", cls: "bg-cat-class-soft text-cat-class border-cat-class/25" },
  { day: 4, start: 1, len: 1.5, title: "Orgo II", cls: "bg-cat-class-soft text-cat-class border-cat-class/25" },
  { day: 1, start: 4, len: 4, title: "Patel lab", cls: "bg-cat-research-soft text-cat-research border-cat-research/25" },
  { day: 3, start: 4, len: 4, title: "Patel lab", cls: "bg-cat-research-soft text-cat-research border-cat-research/25" },
  { day: 0, start: 6, len: 2, title: "Tutoring", cls: "bg-cat-leadership-soft text-cat-leadership border-cat-leadership/25" },
  { day: 4, start: 4.5, len: 3.5, title: "ED scribe", cls: "bg-cat-clinical-soft text-cat-clinical border-cat-clinical/25" },
];
const HOUR_PX = 26;

export function PlannerPreview() {
  return (
    <Frame title="This week">
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {DAY_LABELS.map((d, i) => (
          // Phones show Mon, Tue, Fri: five columns at 390px cut the
          // block titles off.
          <div
            key={d}
            className={`min-w-0 ${i === 2 || i === 3 ? "hidden sm:block" : ""}`}
          >
            <p className="mb-1.5 text-center text-xs font-semibold text-muted">
              {d}
            </p>
            <div
              className="relative rounded-md border border-line bg-surface"
              style={{ height: HOUR_PX * 8 }}
            >
              {BLOCKS.filter((b) => b.day === i).map((b, j) => (
                <div
                  key={j}
                  className={`absolute inset-x-1 overflow-hidden rounded border px-1.5 py-1 text-[11px] leading-tight font-semibold ${b.cls}`}
                  style={{ top: b.start * HOUR_PX, height: b.len * HOUR_PX - 3 }}
                >
                  {b.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-accent-soft px-3.5 py-2.5">
        <span className="text-sm text-accent">
          Hours that count on AMCAS
        </span>
        <span className="font-display text-xl font-semibold text-accent tabular-nums">
          21h / week
        </span>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------- primary -- */

export function PrimaryPreview() {
  const rows = [
    { title: "ED Scribe", type: "Paid employment, clinical", hrs: "620 hrs + 200 planned", flag: { tone: "accent" as const, text: "Most meaningful" } },
    { title: "Undergraduate Researcher", type: "Research/Lab", hrs: "480 hrs" },
    { title: "Free Clinic Volunteer", type: "Volunteer, clinical", hrs: "210 hrs", flag: { tone: "warn" as const, text: "No verifier contact" } },
  ];
  return (
    <Frame title="Work & Activities">
      <div className="mb-3 flex items-baseline gap-5">
        <p>
          <span className="font-display text-2xl font-semibold tabular-nums">4</span>
          <span className="text-sm text-muted"> / 15 activities</span>
        </p>
        <p>
          <span className="font-display text-2xl font-semibold tabular-nums">1,450</span>
          <span className="text-sm text-muted"> hours</span>
        </p>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.title} className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
            <p className="text-sm font-semibold">{r.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <OutlineBadge>{r.type}</OutlineBadge>
              <OutlineBadge>{r.hrs}</OutlineBadge>
              {r.flag && <Badge tone={r.flag.tone}>{r.flag.text}</Badge>}
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/* --------------------------------------------------------- secondaries -- */

export function SecondariesPreview() {
  const groups = [
    { label: "Adversity & challenge", schools: ["Hopkins", "Duke", "Case Western"], limit: "250 words", done: true },
    { label: "Why this school", schools: ["Hopkins", "Emory"], limit: "200 words", done: false },
    { label: "Diversity & perspective", schools: ["Hopkins", "Dartmouth"], limit: "250 words", done: false },
  ];
  return (
    <Frame title="What overlaps">
      <p className="mb-3 text-sm text-muted">
        <span className="font-semibold text-foreground">9 prompts</span> across
        5 schools come down to{" "}
        <span className="font-semibold text-foreground">5 essays</span>.
      </p>
      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.label} className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{g.label}</p>
              {g.done ? <Badge tone="ok">Written</Badge> : <Badge tone="warn">To write</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted">
              {g.schools.join(", ")}. Write to the tightest limit:{" "}
              <span className="font-semibold text-foreground">{g.limit}</span>
            </p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/* ---------------------------------------------------------- interviews -- */

export function InterviewsPreview() {
  return (
    <Frame title="My interviews">
      <div className="mb-3 rounded-lg border border-warn/30 bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
        <span className="font-semibold">1 thank-you note unsent.</span> Send it
        while the conversation is fresh.
      </div>
      <ul className="space-y-2">
        <li className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
          <p className="text-sm font-semibold">Duke</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="info">Scheduled</Badge>
            <OutlineBadge>One-on-one</OutlineBadge>
            <Badge tone="warn">In 13 days</Badge>
          </div>
        </li>
        <li className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
          <p className="text-sm font-semibold">Case Western</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="ok">Interviewed</Badge>
            <OutlineBadge>MMI</OutlineBadge>
            <Badge tone="warn">Thank-you not sent</Badge>
          </div>
        </li>
        <li className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
          <p className="text-sm font-semibold">Emory</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="neutral">Invited, not scheduled</Badge>
          </div>
        </li>
      </ul>
    </Frame>
  );
}
