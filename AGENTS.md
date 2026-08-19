<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->

# MD Atlas — project rules

## What this is now
The original spec described a prompt database with a paid essay-feedback tier.
It is now a dashboard for the whole premed timeline. The top nav holds only
places you *work*, in the order the years happen:

- `/dashboard` — the hub. Progress rings per stage plus "Next up", ordered by
  what actually goes wrong. Every number links to where you can act on it.
- `/planner` — recurring weekly schedule. Blocks carry an activity category, so
  the week totals into hours-per-category and feeds Primary.
- `/primary` — activity log with verifier contacts, Work & Activities drafting
  with AMCAS character limits, personal statement, letters of recommendation.
- `/secondaries` — the tracker: schools, per-essay status, cross-school overlap.
- `/interviews` — interview pipeline plus the question bank, as two tabs.

Reference material is NOT top-level nav. `/prompts` (search) and `/schools`
(browse, one static page per school for SEO) are reached from inside
`/secondaries` and from the footer. Putting them back in the nav is what made
the site read as a prompt library wearing a dashboard costume.

`/pricing` sits in the header too, but deliberately outside the five-item
`NAV` array in `SiteHeader.tsx` — it's not a place you work, so it renders
dimmer and to the side rather than as a sixth peer. It used to live only in
the footer, which meant a visitor deciding whether to bother signing up had
to scroll to the bottom of the page to find out the product is free.

Redirects in `next.config.ts` cover the old URLs: `/my-schools` and `/overlap`
to `/secondaries`, `/interview-prep` to `/interviews`. Applicants bookmark
these in July and return in December, so those redirects are permanent and
must not be dropped.

Accounts are optional and exist only to sync across devices.

Still not built: the essay feedback engine and Stripe. Those remain the paid
tier and the only paid tier.

## The load-bearing product decision
Free covers everything organizational; only feedback is paid. Do not move a
tracking feature behind the paywall or behind a mandatory sign-up. The free
tier is the funnel and the retention story: a sophomore logging hours is
already in the app when their application year arrives.

## Non-negotiables
1. Never generate essay text for a user. No rewritten paragraphs, no suggested
   sentences, no fill-in-the-blank outlines. If output contains prose a user
   could paste into an application, it is wrong.
2. That policy is stated plainly on `/` and `/how-feedback-works`. It is a
   marketing asset, not fine print. Do not bury or soften it.
3. Never claim or imply affiliation with the AAMC, AMCAS, or any school.
4. Never promise or imply an admissions outcome anywhere in copy.
5. Never present an unconfirmed prompt as confirmed for the current cycle.

## Data
- `data/schools.json` and `data/prompt-types.json` are the source of truth.
  Edit those, then run `npm run db:seed`. Do not hand-edit the database.
- `scripts/setup.ts` runs on every build and ALWAYS seeds. It used to skip when
  the database already held prompts, which meant a growing corpus never reached
  production while every local check passed against a fresh database. Do not
  reintroduce that guard. `SKIP_SEED=1` exists for the rare case you need it.
- 161 MD programs, 769 prompts, 153 programs covered. Every prompt carries a
  per-prompt `source` URL — the page its text was actually read from.
- `confirmed` is true only where the text was read on the school's own domain.
  That is currently 7 prompts. Everything else came from aggregators and
  applicant reports and is displayed as unverified. Do not bulk-flip this flag.
- `truncated` marks prompts the *source* cut off. `PromptCard` renders these as
  a block-level warning, not a footnote: text that reads as a complete question
  but is not is the one thing here that can actively waste someone's essay.
  Never "complete" a truncated prompt by inference.
- Each cycle gets its own prompt row. Never mutate a prior-cycle row into the
  current cycle.

## Conventions
- Database reads go in `src/lib/queries.ts`, never inline in a page.
- Filter state lives in the URL, not component state.
- `CURRENT_CYCLE` lives in `src/lib/config.ts`.
- All four client stores (`tracker.ts`, `prep.ts`, `primary.ts`, `planner.ts`)
  follow the
  same shape: localStorage behind `useSyncExternalStore`, a cached snapshot for
  referential stability, and a `mda:local-change` event on write so `SyncPanel`
  can push without polling. Copy that pattern for any new store.

## Accounts and sync
- Local storage is always the working copy. Signing in adds a synced backup; it
  never becomes what the page reads from. Never invert this.
- On sign-in, if both sides hold data and they differ, ASK. Never silently pick
  a winner. Losing an applicant's list in August is not recoverable for them.
- Deleting an account must not touch their local data.
- `/api/sync` stores opaque JSON. The server never interprets the shape, which
  is what keeps client model changes out of the sync path.
- Magic-link auth is custom-built (`src/lib/auth.ts`, `src/lib/mailer.ts`), not
  a third-party provider — hashed single-use tokens, 60-day sessions, rate
  limiting, and a conflict UI when local and server disagree. It's already
  solid; do not replace it with Supabase/Clerk without checking with Dylan
  first, since that would mean throwing away working code for a rebuild.
- `RESEND_API_KEY` must be set in the deploy environment for sign-in emails to
  actually send. Without it, `sendSignInEmail` hard-fails in production (by
  design — see the comment in `mailer.ts`) rather than pretending to work. In
  dev, the sign-in link is returned in the response instead of emailed.
- When adding a field to any store that syncs (tracker, prep, primary,
  planner), add it to `trackerSnapshots` in `src/db/schema.ts` too, and to
  both the GET response and the PUT/POST body in `src/app/api/sync/route.ts`.
  Planner went unsynced for a while this way: the client already sent it, the
  column didn't exist, and the route silently dropped it before the insert —
  no error anywhere, just data that looked backed up and was not.
- `SyncPanel`'s invite to add an email only renders once the browser holds
  real data (see `hasRealData` in that file) and pushes edits within ~400ms
  plus a `visibilitychange` → `sendBeacon` flush on tab close/hide, so the
  window in which an edit exists only in this browser stays small.

## Design
- Colors are defined once in `src/app/globals.css` and mirrored in
  `scripts/check-contrast.ts`. Change both, then run `npm run check:contrast`.
  Every text pairing must clear WCAG AA (4.5:1).
- Status is never communicated by color alone; the label always says it too.
- Every page has exactly one `h1` and a working skip link.

## Brand
- The product is **MD Atlas**. `SITE_NAME` in `src/lib/config.ts` is the single
  source; never hardcode the name in a component.
- The compass mark lives in `src/components/Logo.tsx` and uses `currentColor`
  so one component works on navy and on white. It is intentionally low-detail:
  check any change at 16px before shipping it.

## Motion
- The kit lives at the bottom of `globals.css`: `.anim-rise`, `.anim-pop`,
  `.anim-slide`, `.anim-stagger`, `.anim-ring`, `.lift`, `.link-sweep`.
- Animations may only change how content ARRIVES, never whether it is there.
  Every keyframe ends at the resting state and uses `fill-mode: both`, so a
  browser that never runs it still paints the final frame.
- `Reveal` and `CountUp` must degrade to fully visible, correct content with no
  JS. Never make content depend on an animation having run.
- `prefers-reduced-motion` kills the movement itself, not just the duration, so
  nothing lurches into place in one frame.
- Reveals fire once and disconnect. Nothing re-animates on scroll-back.
- Stagger delays are capped (`min(var(--i), 12)`); an unbounded stagger on a
  200-row list leaves the last row waiting seconds.

## Planner
- The unit is a recurring weekday block, not a dated event. A premed's week
  repeats; asking for 45 separate dates is why planners go unused by week two.
- Every block carries a category from `PLANNER_CATEGORIES`, which mirrors AMCAS
  activity types rather than generic calendar colors. `REPORTABLE` is the subset
  whose hours belong on an application, and the split between reportable and
  everything else must stay visible — a weekly total that quietly includes gym
  time is worse than no total.
- Category colors are a text/fill/edge triple so the identity survives for
  anyone who cannot separate the hues. All pairings are in the contrast script.
<!-- END:project-rules -->
