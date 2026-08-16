/**
 * Database schema for the premed application platform.
 *
 * v1 scope is the prompt database only (build steps 1-3). User accounts,
 * experience logs, and feedback records come later and get their own tables.
 * The prompt data is the durable asset here, so it is modeled carefully now.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "../lib/id";

/** What a prompt's limit number counts. */
export const limitUnitEnum = pgEnum("limit_unit", [
  "words",
  "characters",
  /** School states no limit, or the limit is unknown. */
  "none",
]);

/** A degree-granting medical school. One row per school, not per program. */
export const schools = pgTable(
  "schools",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    /** URL-safe identifier used in public routes: /schools/harvard-medical-school */
    slug: text("slug").notNull(),
    /** Full official name as the school writes it. */
    name: text("name").notNull(),
    /** Short name for compact UI, e.g. "Harvard". */
    shortName: text("short_name"),
    city: text("city"),
    /** Two-letter US state or territory code. */
    state: text("state"),
    /**
     * MD or DO. Plain text rather than an enum so adding program types later
     * does not require a migration.
     */
    degree: text("degree").notNull().default("MD"),
    /** Public admissions page, used to verify prompts against the source. */
    websiteUrl: text("website_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("schools_slug_idx").on(t.slug),
    index("schools_state_idx").on(t.state),
    index("schools_name_idx").on(t.name),
  ],
);

/**
 * Categories used to filter prompts. Stored as rows rather than a hardcoded
 * enum so the taxonomy can grow without a migration.
 */
export const promptTypes = pgTable(
  "prompt_types",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    /** Stable machine key, e.g. "why_this_school". Used in URL query params. */
    key: text("key").notNull(),
    /** Human label, e.g. "Why this school". */
    label: text("label").notNull(),
    /** One-line explanation shown in the filter UI. */
    description: text("description"),
    /** Controls display order in filter lists. */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("prompt_types_key_idx").on(t.key)],
);

/**
 * A single secondary essay prompt, for one school, in one cycle.
 *
 * Prompts repeat heavily year to year. Rather than mutating a row when a cycle
 * rolls over, each cycle gets its own row. That preserves history and keeps the
 * confirmed / carried-over distinction honest.
 */
export const prompts = pgTable(
  "prompts",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),

    /** Application cycle the prompt belongs to, e.g. "2026-2027". */
    cycleYear: text("cycle_year").notNull(),

    /** Verbatim prompt text as published by the school. */
    text: text("text").notNull(),

    promptTypeId: text("prompt_type_id").references(() => promptTypes.id),

    /** Numeric length cap. Null when the school states no limit. */
    limitValue: integer("limit_value"),
    limitUnit: limitUnitEnum("limit_unit").notNull().default("none"),

    /**
     * True only when this exact prompt has been seen on the school's own
     * materials for `cycleYear`. False means carried over from a prior cycle,
     * or sourced second-hand, and not yet re-confirmed.
     *
     * The UI must never present false as current.
     */
    confirmed: boolean("confirmed").notNull().default(false),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

    /** Whether the school marks the prompt optional. */
    optional: boolean("optional").notNull().default(false),

    /** Ordering within the school's secondary, 1-based. */
    position: integer("position").notNull().default(0),

    /** Where this text came from: a URL, or a short description. */
    source: text("source"),
    /** Caveats, e.g. "MD-PhD applicants only", "time-sensitive: 30 days". */
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("prompts_school_cycle_idx").on(t.schoolId, t.cycleYear),
    index("prompts_cycle_idx").on(t.cycleYear),
    index("prompts_type_idx").on(t.promptTypeId),
    index("prompts_confirmed_idx").on(t.confirmed),
  ],
);

export const schoolsRelations = relations(schools, ({ many }) => ({
  prompts: many(prompts),
}));

export const promptTypesRelations = relations(promptTypes, ({ many }) => ({
  prompts: many(prompts),
}));

export const promptsRelations = relations(prompts, ({ one }) => ({
  school: one(schools, {
    fields: [prompts.schoolId],
    references: [schools.id],
  }),
  promptType: one(promptTypes, {
    fields: [prompts.promptTypeId],
    references: [promptTypes.id],
  }),
}));

export type School = typeof schools.$inferSelect;
export type PromptType = typeof promptTypes.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type LimitUnit = (typeof limitUnitEnum.enumValues)[number];

/**
 * Prompts submitted by applicants who actually received a secondary.
 *
 * Nothing here reaches the public site. A submission is raw input until it is
 * reviewed, approved, and hand-copied into data/schools.json, which remains
 * the single source of truth for what the site serves.
 */
export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const promptSubmissions = pgTable(
  "prompt_submissions",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    /** Set when the submitter picked a school we know. */
    schoolSlug: text("school_slug"),
    /** What they typed, kept even when schoolSlug is set, for auditing. */
    schoolNameRaw: text("school_name_raw").notNull(),
    cycleYear: text("cycle_year").notNull(),
    promptText: text("prompt_text").notNull(),
    limitValue: integer("limit_value"),
    limitUnit: limitUnitEnum("limit_unit").notNull().default("none"),
    /** Optional context: "this was the third essay", "received 7/12". */
    note: text("note"),
    /** Optional, so you can follow up. Never displayed publicly. */
    contactEmail: text("contact_email"),
    status: submissionStatus("status").notNull().default("pending"),
    /** Salted hash of the submitter IP, for rate limiting only. */
    submitterHash: text("submitter_hash"),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("prompt_submissions_status_idx").on(t.status),
    index("prompt_submissions_created_idx").on(t.createdAt),
    index("prompt_submissions_hash_idx").on(t.submitterHash),
  ],
);

/* ---------------------------------------------------------------------------
 * Accounts.
 *
 * Optional by design: the tracker works with no account at all. An account
 * buys one thing, syncing across devices, so the model stays deliberately
 * thin. We store an email and a blob of the user's own tracker. No name, no
 * profile, nothing we do not need to deliver that one feature.
 * ------------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    /** Stored lowercased; the unique index below is what prevents duplicates. */
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/**
 * Single-use sign-in tokens.
 *
 * Only a hash is stored, so a database leak does not hand anyone a working
 * login link. Tokens expire fast and are deleted the moment they are used.
 */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("auth_tokens_hash_idx").on(t.tokenHash),
    index("auth_tokens_email_idx").on(t.email),
    index("auth_tokens_expires_idx").on(t.expiresAt),
  ],
);

/** Sessions live in the database so they can actually be revoked. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_hash_idx").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

/**
 * The synced copy of a user's tracker and prep notes.
 *
 * Stored as opaque JSON on purpose. The shape is owned by the client (see
 * lib/tracker.ts), the server never interprets it, and that keeps schema
 * migrations out of the sync path entirely.
 */
export const trackerSnapshots = pgTable("tracker_snapshots", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tracker: jsonb("tracker"),
  prep: jsonb("prep"),
  primary: jsonb("primary"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
