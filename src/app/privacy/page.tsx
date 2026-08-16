import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE_NAME} collects, what it does not, and how to get your data removed.`,
};

/**
 * Written in plain English on purpose.
 *
 * A privacy policy nobody reads is not a privacy policy, it is a liability
 * shield. This one is short enough to actually read and describes exactly what
 * the code does. If the code changes, this page changes in the same commit.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          The short version: your school list never leaves your browser, and the
          only personal thing {SITE_NAME} can store is an email address you
          typed on purpose.
        </p>
      </header>

      <section className="rounded-2xl border border-navy-100 bg-accent-soft p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Your tracker is not on our servers
        </h2>
        <p className="mt-2 leading-relaxed">
          Everything on the My Schools page — which schools you applied to, your
          essays, their statuses, your deadlines, your notes — is saved in your
          own browser using local storage. It is never transmitted to us. We
          could not show you your own list if you asked us to, because we do not
          have it.
        </p>
        <p className="mt-3 leading-relaxed">
          The tradeoff is that clearing your browser data or switching devices
          loses it. That is why the Export button exists, and why we mention it
          on the page rather than burying it here.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          What we actually collect
        </h2>

        <div className="mt-5 space-y-6">
          <div>
            <h3 className="font-semibold">
              If you submit a prompt
            </h3>
            <p className="mt-1.5 leading-relaxed text-muted">
              We store what you typed: the school, the cycle, the prompt text,
              the length limit, and any note. If you fill in the optional email
              field, we store that too, and we use it for exactly one thing —
              asking you a follow-up question if the submission is unclear. It
              is never published, never sold, and never added to a mailing list.
              Leaving it blank is completely fine.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">A one-way hash of your IP address</h3>
            <p className="mt-1.5 leading-relaxed text-muted">
              When you submit a prompt, we take your IP address, mix it with a
              secret value, and store the scrambled result. This lets us notice
              if one source floods the form with spam. The scrambling only works
              in one direction: the stored value cannot be turned back into your
              IP address. We do not store the address itself.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Nothing else</h3>
            <p className="mt-1.5 leading-relaxed text-muted">
              No advertising trackers. No third-party analytics scripts. No
              cookies for visitors — the one cookie this site can set exists
              only on the private admin page and only the site owner ever sees
              it. We do not use your submissions to train anything.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          Companies that touch your data
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          {SITE_NAME} runs on Vercel, which serves the site and keeps standard
          server logs, and on Neon, which hosts the database where submissions
          are stored. That is the entire list.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          Deleting your data
        </h2>
        <div className="mt-3 space-y-3 leading-relaxed text-muted">
          <p>
            <strong className="text-foreground">Your tracker:</strong> the Clear
            Everything button on the My Schools page wipes it immediately. It is
            your browser, so it is genuinely gone.
          </p>
          <p>
            <strong className="text-foreground">A submission:</strong> email and
            say which one, and it gets deleted. You do not have to explain why.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          If accounts arrive later
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          There is a plan to add an optional account so your tracker can follow
          you between your laptop and your phone. Optional is the important
          word: the tracker will keep working with no account at all. If that
          ships, this page gets updated in the same release that ships it, and
          it will say plainly what an account stores.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          Under 18
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          This site is built for people applying to medical school, so most
          visitors are adults. Nothing here is aimed at children, and we do not
          knowingly collect information from anyone under 13.
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold tracking-tight">Questions</h2>
        <p className="mt-2 leading-relaxed text-muted">
          {SITE_NAME} is run by one person, not a company. If something here is
          unclear or you want data removed, get in touch and a human will
          actually read it.
        </p>
        <p className="mt-4 text-sm text-muted">
          Last updated: August 2026. Changes get noted here rather than applied
          quietly.
        </p>
      </section>

      <p className="text-sm">
        <Link
          href="/how-feedback-works"
          className="text-accent underline underline-offset-4 hover:no-underline"
        >
          See also: what our essay feedback will and will not do
        </Link>
      </p>
    </div>
  );
}
