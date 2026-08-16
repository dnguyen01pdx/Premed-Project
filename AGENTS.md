<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->

# Secondary Prompt Library — project rules

## Scope discipline
This repo implements build steps 1-3 only: prompt database, public prompt
browser, no auth. Do not build ahead. Auth, the feedback engine, Stripe, the
experience log, and the trackers come later, in the order given in README.md.

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
<!-- END:project-rules -->
