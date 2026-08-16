# MD Atlas

Build steps 1-3 of the premed application platform: the prompt database schema,
seed data for 27 schools, and a public searchable prompt browser with no auth.

Nothing here is behind a login, on purpose. This is the SEO engine and the top
of the funnel. Auth, the feedback engine, and Stripe come in step 4.

---

## Running it on your computer

You need two things installed first. If you already have them, skip ahead.

**1. Node.js** — download the LTS version from https://nodejs.org and run the
installer. To check it worked, open PowerShell and run:

```powershell
node -v
```

You should see something like `v22.x.x`.

**2. A Postgres database.** You do not need to install Postgres locally. The
easiest path is a free hosted one:

- Go to https://neon.com and sign up (free tier is plenty).
- Create a project. It will show you a connection string that looks like
  `postgresql://user:password@ep-something.aws.neon.tech/neondb?sslmode=require`
- Copy that string.

**3. Set up the project.** In PowerShell, `cd` into this folder, then:

```powershell
npm install
```

Then create a file named `.env.local` in this folder containing one line, with
your Neon string pasted in:

```
DATABASE_URL="postgresql://user:password@ep-something.aws.neon.tech/neondb?sslmode=require"
```

(There is a `.env.example` in this folder you can copy and edit.)

**4. Create the tables and load the prompts.**

```powershell
npm run db:setup
```

You should see `Seeded 27 schools and 138 prompts.`

**5. Start it.**

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Deploying without ever opening a terminal

`npm run build` runs `scripts/setup.ts` first, which creates the tables and
loads the prompts if the database is empty. That means a fresh deploy sets
itself up with no manual step.

So the whole browser-only path is:

1. Create a free Postgres database at https://neon.com and copy its connection
   string.
2. Put this project in a GitHub repo (github.com lets you drag a folder into
   the web uploader).
3. At https://vercel.com, import that repo.
4. Add an environment variable `DATABASE_URL` with the Neon connection string,
   and `NEXT_PUBLIC_SITE_URL` with your site's URL.
5. Deploy. The build creates the tables and loads all 138 prompts by itself.

Re-running a deploy will not duplicate data: seeding is skipped once prompts
exist. To reload after editing `data/schools.json`, set `FORCE_SEED=1` in the
environment variables for one deploy, then remove it.

---

## The commands you will actually use

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site locally with hot reload |
| `npm run build` | Production build; run this before deploying to catch errors |
| `npm run db:setup` | Creates the tables and loads the prompts. Safe to re-run |
| `npm run db:push` | Applies `src/db/schema.ts` to the database |
| `npm run db:seed` | Loads `data/*.json` into the database (safe to re-run) |
| `npm run db:studio` | Opens a browser UI to view and edit the data directly |
| `npm run db:reset` | Wipes the database and reloads everything from JSON |
| `npm run lint` | Checks for code problems |

---

## Where things live

```
data/
  prompt-types.json   The filter taxonomy (14 categories)
  schools.json        All schools and their prompts. This is the data asset.
drizzle/
  *.sql               Generated table definitions. Applied automatically.
scripts/
  setup.ts            Creates tables + seeds if empty. Runs during `npm run build`.
  seed.ts             Loads the JSON into Postgres. Idempotent.
  reset.ts            Drops all tables.
src/
  db/schema.ts        Table definitions. The source of truth for structure.
  lib/queries.ts      Every database read the app performs.
  lib/config.ts       CURRENT_CYCLE lives here. Bump it once a year.
  app/                Pages.
  components/         Prompt card and the filter bar.
```

**To fix or add a prompt:** edit `data/schools.json`, then run `npm run db:seed`.
The seeder replaces each school's prompts for that cycle, so corrections take
effect immediately and nothing is duplicated.

---

## Read this before you launch: the data is not verified

Every prompt in `data/schools.json` currently has `confirmed: false`. That is
accurate, not a placeholder. The text was compiled from a third-party
aggregator, not read off each school's own secondary application.

The UI reflects this honestly. Prompts show one of three badges:

- **Confirmed for 2026-2027** — verified against the school's own materials
- **Reported for 2026-2027 · not yet verified** — current cycle, second-hand source
- **From the 2025-2026 cycle · may not repeat** — carried over from a prior year

Four schools (Brown, Columbia, Emory, UCSF) are on prior-cycle data because the
current cycle's prompts were not available. They are labeled as such everywhere.

Some prompts are also marked in their `notes` field as truncated or paraphrased
at the source. Those need the full wording filled in.

**Before you put this in front of applicants:**

1. Work through `data/schools.json` school by school.
2. Check the prompt against the school's own admissions page (each school has a
   `websiteUrl`), or against a secondary you or a friend actually received.
3. When a prompt matches, add `"confirmed": true` to that prompt object.
4. Re-run `npm run db:seed`.

This is tedious and it is also the whole moat. A prompt database that is right
when the aggregators are wrong is the reason someone bookmarks your site.

One more thing: the compiled prompt text came from `medcoach.io`, credited in
the `source` field and linked at the bottom of each school page. The prompts
themselves are the schools' words, not the aggregator's, so republishing them is
defensible. Verifying against primary sources removes the question entirely.

---

## Deploying

The site is a standard Next.js app and deploys to Vercel with no configuration:

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com, import the repo.
3. Add an environment variable `DATABASE_URL` with your Neon connection string.
4. Add `NEXT_PUBLIC_SITE_URL` with your real domain, e.g.
   `https://secondaryprompts.com`. The sitemap uses it.
5. Deploy.

School pages are statically generated at build time and revalidate hourly, so
search engines get fast HTML and your database barely gets touched.

---

## What is deliberately not here

Per the build spec, none of this is built yet and none of it should be until
the prompt browser is in front of real applicants:

- Accounts and auth (step 4)
- The essay feedback engine and Stripe (steps 4, 5, 7)
- Experience log and export (step 6)
- LOR tracker and secondary status tracker (step 8)

Also permanently out of scope: school list builder, GPA calculator, interview
prep, mentorship tier.

---

## Design decisions worth knowing

**Each cycle gets its own prompt row.** Prompts repeat heavily year to year, but
rather than mutating a row when the cycle rolls over, a new row is written. That
preserves history and makes the confirmed / carried-over distinction structural
rather than a convention someone can forget.

**Prompt types are rows, not an enum.** The spec listed eight types. The real
data needed six more (research, community service, clinical experience, personal
background, reapplicant, administrative) because forcing a research prompt into
"open-ended" makes the filter worse than no filter. Adding a type is a JSON edit,
not a migration.

**Length filters exclude prompts with no stated limit.** Filtering to "under 250
words" will not show a prompt whose limit is unknown. Showing it would imply the
limit is known and small.

**Filter state lives in the URL.** Every view is bookmarkable and indexable,
which matters when the whole point of this tier is search traffic.

**No web fonts.** System font stack only: no external request, no layout shift.
For a text-heavy site that lives on search, that beats a custom typeface.
