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

Still not built: the essay feedback engine itself. That remains the one thing
Pro actually pays for. The payment and entitlement infrastructure to sell
access to it (Stripe checkout, webhook-granted Pro, promo codes) is built and
live; see "Payments and Pro" below. Until the feedback engine ships, Pro is a
paid placeholder — `ProPreviewToggle` says so on `/account`.

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
- The only sign-in entry point is "Continue with Google"
  (`GoogleSignInButton.tsx` on `/account`), backed by a hand-rolled OAuth
  Authorization Code flow (`/api/auth/google/start`, `/api/auth/google/callback`)
  — not next-auth or a third-party auth provider. `start` sets a short-lived
  CSRF state cookie (`GOOGLE_OAUTH_STATE_COOKIE` in `auth.ts`) and redirects to
  Google; `callback` checks that state, exchanges the code, confirms
  `email_verified`, then calls `startSessionForEmail()` — the same
  find-or-create-user-and-open-a-session helper in `auth.ts` that the original
  magic-link flow used, so Google is just a second way of proving you own an
  email address, not a second notion of what a user is.
- The magic-link code (`createSignInToken`, `consumeSignInToken`,
  `/api/auth/request`, `/auth/verify`, `mailer.ts`, `SignInForm.tsx`) is still
  in the repo but intentionally unlinked from any page — Dylan chose Google-only
  over running both, so nothing routes to it anymore. It's dead code kept as a
  rollback path, not a second live sign-in method; don't wire it back into the
  UI without checking with Dylan first, and don't delete it reflexively either.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must be set in every
  environment sign-in needs to work in (Vercel and local `.env.local`). Without
  them, `/api/auth/google/start` logs an error and redirects to
  `/account?error=google` instead of pretending to work — same posture as the
  old `RESEND_API_KEY` check. The OAuth client lives in the "MD Atlas" Google
  Cloud project under `mdatlas.help@gmail.com`; its authorized redirect URIs
  are the production and localhost `/api/auth/google/callback` URLs, both of
  which must stay registered there if either origin changes.
- When adding a field to any store that syncs (tracker, prep, primary,
  planner), add it to `trackerSnapshots` in `src/db/schema.ts` too, and to
  both the GET response and the PUT/POST body in `src/app/api/sync/route.ts`.
  Planner went unsynced for a while this way: the client already sent it, the
  column didn't exist, and the route silently dropped it before the insert —
  no error anywhere, just data that looked backed up and was not.
- `SyncPanel` no longer offers to add an email — signing in
  (`GoogleSignInButton.tsx`) lives only on `/account`, reached through the
  "Sign in" link in `SiteHeader`. `SyncPanel` still renders on every tracking
  page, but only to
  reflect state produced elsewhere: nothing when signed out, the synced/saving
  badge or the conflict prompt when signed in. It pushes edits within ~400ms
  plus a `visibilitychange` → `sendBeacon` flush on tab close/hide, so the
  window in which an edit exists only in this browser stays small.
- The header's "Sign in" link always points at `/account` regardless of auth
  state — signed out that page is the sign-in form, signed in it's account
  management. `SiteHeader` deliberately doesn't fetch auth state itself to
  decide the label; if that starts to read as wrong once actually signed in,
  revisit it then rather than adding a client-side auth check to every page.

## Payments and Pro
- Real Pro status is server-authoritative: `users.isPro` plus `proSource`
  (`"stripe"` or `"promo"`), `proGrantedAt`, `stripeCustomerId`, and
  `stripeCheckoutSessionId` in `src/db/schema.ts`. It is set exactly two ways,
  both in `src/lib/pro.ts`: `grantProFromStripe()` from the webhook, or
  `redeemPromoCode()` from `/api/promo/redeem`. Never set `isPro` from
  anywhere else, including client code.
- This is deliberately separate from the older, client-side-only
  `entitlements.ts` (`localStorage`, `mda.entitlements.v1`, `pro: boolean`)
  that `EssayMapPanel.tsx`, `MyOverlap.tsx`, `TrackerBoard.tsx`, and
  `ProPreviewToggle.tsx` already read from. `ProSync.tsx`, rendered once on
  `/secondaries`, is the one-directional bridge: it flips the local flag on
  when the server confirms real Pro, and never flips it off. Don't touch the
  Pro-gated components' internals to wire in server state directly; extend
  `ProSync` instead if a new page needs the bridge.
- Stripe is a one-time $49 payment (`mode: "payment"`), not a subscription,
  via hosted Checkout: `/api/checkout/start` creates the session and
  redirects, `/api/stripe/webhook` grants Pro on `checkout.session.completed`
  with `payment_status === "paid"`. No client-side Stripe.js — everything
  goes through the server `stripe` package. Both routes are gated behind
  `isStripeConfigured()` (`src/lib/stripe.ts`), which checks `STRIPE_SECRET_KEY`
  and `STRIPE_PRICE_ID`. Unset means checkout redirects to
  `/pricing?error=notready` instead of throwing, same posture as the
  `GOOGLE_CLIENT_SECRET` and `RESEND_API_KEY` checks elsewhere. The webhook
  reads the raw body via `req.text()` before any JSON parsing; verifying the
  signature needs the exact bytes Stripe sent, so never add body parsing
  ahead of `stripe.webhooks.constructEvent()` in that route.
- Promo codes are fully independent of Stripe and work with no payment setup.
  `/admin/promo` (same `ADMIN_PASSWORD` gate as `/admin/submissions`, shared
  helper now in `src/lib/admin.ts`) creates and deletes codes and shows
  redemption counts. A code optionally carries `maxRedemptions` (null =
  unlimited) and `expiresAt`. The real guard against double redemption is the
  unique index on `(promoCodeId, userId)` in `promo_redemptions`; the
  application-level check in `redeemPromoCode()` only exists to return a
  friendlier message than a raw constraint failure. An already-Pro account is
  blocked from redeeming at all, before the code lookup even runs, so it
  can't burn a limited-quantity code's slot for no reason.
- To actually take real payments, someone with access to the Stripe account
  needs to set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` (one Product, one
  one-time Price), and `STRIPE_WEBHOOK_SECRET` (from a webhook endpoint at
  `/api/stripe/webhook` subscribed to at least `checkout.session.completed`)
  in Vercel and local `.env.local`. Until then, `/pricing`'s Buy button
  degrades to "Purchasing is not open yet" and promo codes remain the only
  way to grant Pro.
- Adding a migration means committing both the generated `drizzle/000N_*.sql`
  file AND its entry in `drizzle/meta/_journal.json`. `scripts/setup.ts`
  reads the journal to decide what's pending, not a directory scan of `.sql`
  files, so a `.sql` file without a matching journal entry is invisible to
  `migrate()`: the build step logs "Applying database migrations..." and
  exits clean, with no error and no warning, having silently done nothing.
  This happened once (the `isPro`/Stripe columns went live in code while
  production's `users` table still lacked them, breaking every page that
  reads a session). If a page starts throwing "column ... does not exist"
  right after a deploy that should have migrated the database, check the
  journal first.

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
