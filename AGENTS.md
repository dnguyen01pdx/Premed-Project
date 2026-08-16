<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->

# MD Atlas — project rules

## What this is now
The original spec described a prompt database with a paid essay-feedback tier.
The product has deliberately grown into a dashboard for the whole application
cycle, in three stages that mirror the applicant's year:

- `/primary` — activity log with verifier contacts, Work & Activities drafting
  with AMCAS character limits, personal statement, letters of recommendation.
- `/my-schools` — secondary prompts per school, per-essay status, cross-school
  overlap, and the interview pipeline.
- `/interview-prep` — question bank with what each question tests.

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
- A prompt's `confirmed` flag may only be set true after the text has been
  checked against the school's own materials for that cycle.
- Each cycle gets its own prompt row. Never mutate a prior-cycle row into the
  current cycle.

## Conventions
- Database reads go in `src/lib/queries.ts`, never inline in a page.
- Filter state lives in the URL, not component state.
- `CURRENT_CYCLE` lives in `src/lib/config.ts`.
- All three client stores (`tracker.ts`, `prep.ts`, `primary.ts`) follow the
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
- `Reveal` and `CountUp` must degrade to fully visible, correct content with no
  JS. Never make content depend on an animation having run.
- Everything respects `prefers-reduced-motion`.
- Reveals fire once and disconnect. Nothing re-animates on scroll-back.
<!-- END:project-rules -->
