/**
 * The primary application: experiences, personal statement, letters, dates.
 *
 * Two audiences share one data model, and that is the whole design.
 *
 *   A sophomore uses this as a running log. They add a shift at the free
 *   clinic, note who supervised it, and jot what happened while it is fresh.
 *
 *   Three years later the same person is an applicant. Those entries already
 *   have their hours, their dates, and — the part everyone gets wrong — the
 *   supervisor's email. Now they write the 700-character version, and the
 *   notes they left themselves are the raw material.
 *
 * Hence one `Experience` type carrying both the log fields and the AMCAS
 * fields, rather than two features that do not talk to each other.
 *
 * Storage is the browser, same as everything else, and it rides along with
 * the account sync when signed in.
 */

export const PRIMARY_STORAGE_KEY = "mda.primary.v1";

/** AMCAS caps the Work & Activities section at 15 entries. */
export const MAX_ENTRIES = 15;
/** Each entry's description. */
export const DESCRIPTION_LIMIT = 700;
/** Up to 3 entries get an extra "most meaningful" essay. */
export const MAX_MOST_MEANINGFUL = 3;
export const MOST_MEANINGFUL_LIMIT = 1325;
export const PERSONAL_STATEMENT_LIMIT = 5300;

/** AMCAS's own experience categories, in their wording. */
export const EXPERIENCE_TYPES = [
  "Artistic Endeavors",
  "Community Service/Volunteer - Medical/Clinical",
  "Community Service/Volunteer - Not Medical/Clinical",
  "Conferences Attended",
  "Extracurricular Activities",
  "Hobbies",
  "Honors/Awards/Recognitions",
  "Intercollegiate Athletics",
  "Leadership - Not Listed Elsewhere",
  "Military Service",
  "Paid Employment - Medical/Clinical",
  "Paid Employment - Not Medical/Clinical",
  "Physician Shadowing/Clinical Observation",
  "Presentations/Posters",
  "Publications",
  "Research/Lab",
  "Teaching/Tutoring/Teaching Assistant",
  "Other",
] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

/** A repeat stint at the same place, which AMCAS allows up to three of. */
export type DateRange = {
  start?: string; // yyyy-mm
  end?: string;
  hours?: number;
};

export type Experience = {
  id: string;
  title: string;
  organization?: string;
  type: ExperienceType;
  start?: string; // yyyy-mm
  end?: string;
  ongoing: boolean;
  completedHours?: number;
  /** AMCAS splits these; keeping them separate avoids a common overcount. */
  anticipatedHours?: number;
  additionalRanges: DateRange[];

  /* The part people wish they had recorded three years earlier. */
  supervisorName?: string;
  supervisorTitle?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;

  /** Running log: specific moments, written down while they are fresh. */
  notes?: string;
  /** The 700-character AMCAS description. */
  description?: string;
  mostMeaningful: boolean;
  /** The extra 1,325 characters. */
  mostMeaningfulEssay?: string;
};

export type LetterWriter = {
  id: string;
  name: string;
  role?: string;
  relationship?: string;
  askedOn?: string;
  agreed: boolean;
  submitted: boolean;
  thankYouSent: boolean;
  notes?: string;
};

export type Milestones = {
  mcatTakenOn?: string;
  transcriptsSentOn?: string;
  amcasSubmittedOn?: string;
  amcasVerifiedOn?: string;
};

export type PrimaryState = {
  version: 1;
  updatedAt: string;
  experiences: Experience[];
  personalStatement: string;
  letters: LetterWriter[];
  milestones: Milestones;
};

const EMPTY: PrimaryState = {
  version: 1,
  updatedAt: "",
  experiences: [],
  personalStatement: "",
  letters: [],
  milestones: {},
};

export function emptyPrimary(): PrimaryState {
  return { ...EMPTY, updatedAt: new Date().toISOString() };
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function newExperience(): Experience {
  return {
    id: newId(),
    title: "",
    type: "Other",
    ongoing: false,
    additionalRanges: [],
    mostMeaningful: false,
  };
}

export function newLetter(): LetterWriter {
  return {
    id: newId(),
    name: "",
    agreed: false,
    submitted: false,
    thankYouSent: false,
  };
}

/**
 * Total hours across the main range and any repeat stints.
 *
 * Completed and anticipated stay separate all the way through, because
 * "1,200 hours" that quietly includes hours you have not worked yet is the
 * kind of number that falls apart in an interview.
 */
export function experienceHours(e: Experience) {
  const extra = e.additionalRanges.reduce((n, r) => n + (r.hours ?? 0), 0);
  return {
    completed: (e.completedHours ?? 0) + extra,
    anticipated: e.anticipatedHours ?? 0,
  };
}

export function primaryTotals(state: PrimaryState) {
  let completed = 0;
  let anticipated = 0;
  let missingSupervisor = 0;
  let described = 0;

  for (const e of state.experiences) {
    const h = experienceHours(e);
    completed += h.completed;
    anticipated += h.anticipated;
    if (!e.supervisorEmail?.trim() && !e.supervisorPhone?.trim()) {
      missingSupervisor++;
    }
    if (e.description?.trim()) described++;
  }

  const mostMeaningful = state.experiences.filter((e) => e.mostMeaningful).length;

  return {
    entries: state.experiences.length,
    entriesLeft: MAX_ENTRIES - state.experiences.length,
    completed,
    anticipated,
    missingSupervisor,
    described,
    mostMeaningful,
    mostMeaningfulLeft: MAX_MOST_MEANINGFUL - mostMeaningful,
    lettersAsked: state.letters.length,
    lettersIn: state.letters.filter((l) => l.submitted).length,
    thankYouOwed: state.letters.filter((l) => l.submitted && !l.thankYouSent)
      .length,
  };
}

/**
 * AMCAS counts characters, and it counts them the way a computer does. Newlines
 * count. This is deliberately the naive length so the number never flatters.
 */
export function charCount(text: string | undefined): number {
  return (text ?? "").length;
}

/* ------------------------------ parsing ---------------------------------- */

function str(v: unknown, max = 2000): string | undefined {
  return typeof v === "string" && v.trim() ? v.slice(0, max) : undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  return undefined;
}

function isMonth(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}$/.test(v);
}

function isDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function parseRanges(raw: unknown): DateRange[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 3).map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return {
      start: isMonth(o.start) ? o.start : undefined,
      end: isMonth(o.end) ? o.end : undefined,
      hours: num(o.hours),
    };
  });
}

export function parsePrimary(raw: unknown): PrimaryState {
  if (!raw || typeof raw !== "object") return emptyPrimary();
  const obj = raw as Record<string, unknown>;

  const experiences: Experience[] = [];
  const seen = new Set<string>();

  if (Array.isArray(obj.experiences)) {
    for (const item of obj.experiences.slice(0, MAX_ENTRIES)) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      const id = typeof e.id === "string" && e.id ? e.id : newId();
      if (seen.has(id)) continue;
      seen.add(id);

      experiences.push({
        id,
        title: str(e.title, 200) ?? "",
        organization: str(e.organization, 200),
        type: (EXPERIENCE_TYPES as readonly string[]).includes(e.type as string)
          ? (e.type as ExperienceType)
          : "Other",
        start: isMonth(e.start) ? e.start : undefined,
        end: isMonth(e.end) ? e.end : undefined,
        ongoing: e.ongoing === true,
        completedHours: num(e.completedHours),
        anticipatedHours: num(e.anticipatedHours),
        additionalRanges: parseRanges(e.additionalRanges),
        supervisorName: str(e.supervisorName, 200),
        supervisorTitle: str(e.supervisorTitle, 200),
        supervisorEmail: str(e.supervisorEmail, 320),
        supervisorPhone: str(e.supervisorPhone, 60),
        notes: str(e.notes, 20000),
        description: str(e.description, DESCRIPTION_LIMIT * 2),
        mostMeaningful: e.mostMeaningful === true,
        mostMeaningfulEssay: str(e.mostMeaningfulEssay, MOST_MEANINGFUL_LIMIT * 2),
      });
    }
  }

  const letters: LetterWriter[] = [];
  const seenL = new Set<string>();
  if (Array.isArray(obj.letters)) {
    for (const item of obj.letters.slice(0, 30)) {
      if (!item || typeof item !== "object") continue;
      const l = item as Record<string, unknown>;
      const id = typeof l.id === "string" && l.id ? l.id : newId();
      if (seenL.has(id)) continue;
      seenL.add(id);
      letters.push({
        id,
        name: str(l.name, 200) ?? "",
        role: str(l.role, 200),
        relationship: str(l.relationship, 300),
        askedOn: isDate(l.askedOn) ? l.askedOn : undefined,
        agreed: l.agreed === true,
        submitted: l.submitted === true,
        thankYouSent: l.thankYouSent === true,
        notes: str(l.notes, 2000),
      });
    }
  }

  const m = (obj.milestones ?? {}) as Record<string, unknown>;

  return {
    version: 1,
    updatedAt:
      typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
    experiences,
    personalStatement:
      typeof obj.personalStatement === "string"
        ? obj.personalStatement.slice(0, PERSONAL_STATEMENT_LIMIT * 2)
        : "",
    letters,
    milestones: {
      mcatTakenOn: isDate(m.mcatTakenOn) ? m.mcatTakenOn : undefined,
      transcriptsSentOn: isDate(m.transcriptsSentOn)
        ? m.transcriptsSentOn
        : undefined,
      amcasSubmittedOn: isDate(m.amcasSubmittedOn)
        ? m.amcasSubmittedOn
        : undefined,
      amcasVerifiedOn: isDate(m.amcasVerifiedOn) ? m.amcasVerifiedOn : undefined,
    },
  };
}

/* --------------------------- external store ------------------------------ */

let cachedRaw: string | null = null;
let cachedState: PrimaryState = EMPTY;
const listeners = new Set<() => void>();

export function subscribeToPrimary(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === PRIMARY_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getPrimarySnapshot(): PrimaryState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PRIMARY_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    cachedState = raw ? parsePrimary(JSON.parse(raw)) : EMPTY;
  } catch {
    cachedState = EMPTY;
  }
  return cachedState;
}

export function getPrimaryServerSnapshot(): PrimaryState {
  return EMPTY;
}

export function commitPrimary(next: PrimaryState): boolean {
  const withStamp = { ...next, updatedAt: new Date().toISOString() };
  let ok = true;
  try {
    window.localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(withStamp));
    cachedRaw = window.localStorage.getItem(PRIMARY_STORAGE_KEY);
    cachedState = parsePrimary(withStamp);
  } catch {
    ok = false;
    cachedRaw = null;
    cachedState = parsePrimary(withStamp);
  }
  for (const l of listeners) l();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mda:local-change"));
  }
  return ok;
}

export function subscribeNever(): () => void {
  return () => {};
}

/* ------------------------------- export ---------------------------------- */

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

/**
 * CSV built for transcription into AMCAS: one row per experience, columns in
 * roughly the order the form asks for them.
 */
export function experiencesToCsv(state: PrimaryState): string {
  const header = [
    "Experience name",
    "Organization",
    "Experience type",
    "Start",
    "End",
    "Ongoing",
    "Completed hours",
    "Anticipated hours",
    "Contact name",
    "Contact title",
    "Contact email",
    "Contact phone",
    "Most meaningful",
    "Description",
    "Most meaningful essay",
    "My notes",
  ];
  const lines = [header.join(",")];

  for (const e of state.experiences) {
    const h = experienceHours(e);
    lines.push(
      [
        csvEscape(e.title),
        csvEscape(e.organization ?? ""),
        csvEscape(e.type),
        csvEscape(e.start ?? ""),
        csvEscape(e.ongoing ? "Ongoing" : (e.end ?? "")),
        csvEscape(e.ongoing ? "Yes" : "No"),
        String(h.completed),
        String(h.anticipated),
        csvEscape(e.supervisorName ?? ""),
        csvEscape(e.supervisorTitle ?? ""),
        csvEscape(e.supervisorEmail ?? ""),
        csvEscape(e.supervisorPhone ?? ""),
        csvEscape(e.mostMeaningful ? "Yes" : "No"),
        csvEscape(e.description ?? ""),
        csvEscape(e.mostMeaningfulEssay ?? ""),
        csvEscape(e.notes ?? ""),
      ].join(","),
    );
  }
  return lines.join("\n");
}
