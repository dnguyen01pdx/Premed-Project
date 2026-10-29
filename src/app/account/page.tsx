import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import {
  deleteAccount,
  getCurrentUser,
  signOutCurrentSession,
  safeNextPath,
  TRIAL_DAYS,
} from "@/lib/auth";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe";
import { cancelSubscriptionForDeletion, startTrial } from "@/lib/pro";
import { CompassMark } from "@/components/Logo";
import { PromoCodeForm } from "@/components/PromoCodeForm";
import { ExportDataButtons } from "@/components/ExportDataButtons";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

async function doSignOut() {
  "use server";
  await signOutCurrentSession();
  redirect("/secondaries");
}

async function doStartTrial() {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/account?error=signinfirst");
  await startTrial(user.id);
  // Straight to where the Pro features are, so the trial starts with them.
  redirect("/secondaries?trial=1");
}

async function doDelete(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) return;
  // Typing the address is the confirmation. A one-click delete of someone's
  // whole cycle is not a button that should be easy to hit by accident.
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== user.email) {
    revalidatePath("/account");
    return;
  }
  // Stop billing before the account disappears; afterwards nothing could.
  if (!(await cancelSubscriptionForDeletion(user.id))) {
    redirect("/account?error=cancelfirst");
  }
  await deleteAccount(user.id);
  redirect("/secondaries?deleted=1");
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

/** One plain sentence about the plan, for the Pro card. */
function planLine(
  plan: string | null,
  until: Date | null,
  subscribed: boolean,
): string {
  if (!until) return "You have Pro on this account, with no end date.";
  if (plan === "monthly" && subscribed) {
    return "You are on the monthly plan. It renews each month until you cancel.";
  }
  if (plan === "monthly") {
    return `Your subscription is canceled. Pro stays on until ${fmtDate(until)}.`;
  }
  return `3-month pass, active until ${fmtDate(until)}. It does not renew.`;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const upgraded = (Array.isArray(sp.upgraded) ? sp.upgraded[0] : sp.upgraded) === "1";
  const next = safeNextPath(Array.isArray(sp.next) ? sp.next[0] : sp.next);
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="space-y-10">
        {/* Its own navy hero, the same negative-margin pattern the homepage
            uses — a dedicated sign-in screen reads as an event, not just
            another settings page, and this is the one place in the product
            where that is the right amount of ceremony. */}
        <section className="-mx-5 -mt-10 overflow-hidden bg-navy-900 px-5 py-14 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-12 sm:py-16">
          <div className="mx-auto max-w-sm text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-white"
            >
              <CompassMark className="h-8 w-8" />
              <span className="text-lg font-semibold tracking-tight">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-2 text-sm text-navy-100">
              Your medical school application, organized.
            </p>

            <div className="mt-8 rounded-2xl bg-surface p-6 text-left text-foreground shadow-2xl sm:p-7">
              <h1 className="text-xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted">
                Sign in to sync your dashboard
              </p>

              {error === "invalid" && (
                <p className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
                  That sign-in link has already been used or has expired.
                  Links work once and last 15 minutes. Try signing in again
                  below.
                </p>
              )}
              {error === "missing" && (
                <p className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
                  That link was incomplete. Try signing in again below.
                </p>
              )}
              {error === "google" && (
                <p className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
                  Google sign-in did not go through. Nothing was saved or
                  changed. Try again below.
                </p>
              )}
              {error === "signinfirst" && (
                <p className="mt-4 rounded-xl border border-line-strong bg-sunken p-3.5 text-sm">
                  Sign in first, then head back to Pricing to upgrade.
                </p>
              )}

              <div className="mt-6">
                <GoogleSignInButton next={next} />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                No password, just your Google account. We use your email for
                sign-in and to tell you when essay feedback launches. Nothing
                else.{" "}
                <Link
                  href="/privacy"
                  className="text-accent underline underline-offset-2 hover:no-underline"
                >
                  Privacy
                </Link>
              </p>
            </div>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-navy-100 hover:text-white"
            >
              <span aria-hidden="true">&larr;</span> Back to home
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-lg space-y-6">
          <p className="leading-relaxed text-muted">
            You do not need an account. The dashboard works fully without
            one. Signing in only adds syncing, so your work follows you
            between devices.
          </p>

          <Link
            href="/secondaries"
            className="inline-block rounded-xl border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            Go to my dashboard without signing in
          </Link>

          <ExportDataButtons />
        </div>
      </div>
    );
  }

  const stripeReady = isStripeConfigured();

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Signed in as <strong className="text-foreground">{user.email}</strong>.
        </p>
      </header>

      {(error === "alreadysubscribed" ||
        error === "noportal" ||
        error === "cancelfirst") && (
        <p className="rounded-xl border border-warn/30 bg-warn-soft p-3.5 text-sm text-warn">
          {error === "alreadysubscribed"
            ? "You already have a monthly subscription, so nothing new was charged. Manage it below."
            : error === "noportal"
              ? `The billing page could not open right now. Try again in a minute, or email ${CONTACT_EMAIL} and it will be handled by hand.`
              : `Your account was not deleted, because your subscription could not be canceled first and would have kept charging you. Try again in a minute, or email ${CONTACT_EMAIL}.`}
        </p>
      )}

      {upgraded && !user.isPro && (
        <p className="rounded-xl border border-line-strong bg-sunken p-3.5 text-sm">
          Payment received. This can take a few seconds to show up here,
          reload if it still says Free.
        </p>
      )}

      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">What {SITE_NAME} stores for you</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>Your email address, used to sign you in.</li>
          <li>
            A copy of your dashboard: schools, essays, statuses, interviews and
            prep notes, so it can follow you between devices.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          That is everything.{" "}
          <Link
            href="/privacy"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            Read the privacy policy
          </Link>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Pro</h2>
          {user.isPro && (
            <span className="rounded-full bg-ok-soft px-3 py-1 text-xs font-semibold text-ok">
              Active
            </span>
          )}
        </div>

        {user.isPro ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {planLine(user.proPlan, user.proUntil, user.hasSubscription)} It
              follows your sign-in, not this browser, so it is there wherever
              you sign in.
            </p>
            {user.hasSubscription && (
              <a
                href="/api/billing/portal"
                className="mt-4 inline-block rounded-xl border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
              >
                Manage or cancel subscription
              </a>
            )}
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {user.proPlan && user.proUntil
                ? `Your Pro ended ${fmtDate(user.proUntil)}. `
                : ""}
              $20 a month, or $49 for three months. See{" "}
              <Link
                href="/pricing"
                className="text-accent underline underline-offset-2 hover:no-underline"
              >
                what it unlocks
              </Link>
              .
            </p>
            {stripeReady ? (
              <Link
                href="/pricing"
                className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
              >
                Choose a plan
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Purchasing is not open yet.
              </p>
            )}
            <div className="mt-5 border-t border-line pt-5">
              <PromoCodeForm />
            </div>
          </>
        )}
      </section>

      {!user.isPro && (
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold">Free trial</h2>
          {user.onTrial && user.trialEndsAt ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your free trial is on. Every Pro feature is unlocked until{" "}
              <strong className="text-foreground">
                {fmtDateTime(user.trialEndsAt)}
              </strong>
              . After that it switches off on its own, nothing is charged, and
              everything you entered stays yours.
            </p>
          ) : user.trialEndsAt ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your free trial ended {fmtDate(user.trialEndsAt)}. Everything you
              entered is still here and still free; Pro adds the full analysis
              on top.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Try every Pro feature free for {TRIAL_DAYS} days: the full
                Essay Map, the complete ranked list of what to write next, and
                every insight. No card needed, and it ends on its own.
              </p>
              <form action={doStartTrial}>
                <button
                  type="submit"
                  className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
                >
                  Start my free trial
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <ExportDataButtons />

      <form action={doSignOut}>
        <button
          type="submit"
          className="rounded-xl border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
        >
          Sign out
        </button>
      </form>

      <section className="rounded-2xl border border-danger/30 bg-danger-soft p-6">
        <h2 className="font-semibold text-danger">Delete your account</h2>
        <p className="mt-2 text-sm leading-relaxed text-danger">
          This deletes your email and your synced dashboard from our database
          immediately. It cannot be undone. The copy saved in this browser stays
          put, so you will not lose your work here.
          {user.hasSubscription &&
            " Your monthly subscription is canceled at the same time, and Pro ends right away."}
        </p>
        <form action={doDelete} className="mt-4 space-y-3">
          <label htmlFor="confirm" className="block text-sm text-danger">
            Type <strong>{user.email}</strong> to confirm
          </label>
          <input
            id="confirm"
            name="confirm"
            autoComplete="off"
            className="w-full rounded-lg border border-danger/40 bg-surface px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Delete my account
          </button>
        </form>
      </section>

      <p className="text-sm text-muted">
        Questions?{" "}
        <Link
          href="/contact"
          className="text-accent underline underline-offset-2 hover:no-underline"
        >
          Get in touch
        </Link>
        .
      </p>
    </div>
  );
}
