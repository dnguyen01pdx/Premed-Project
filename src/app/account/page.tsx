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
import { ToolHeader } from "@/components/ToolHeader";

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
  if (
    String(formData.get("confirm") ?? "")
      .trim()
      .toLowerCase() !== user.email
  ) {
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
  const upgraded =
    (Array.isArray(sp.upgraded) ? sp.upgraded[0] : sp.upgraded) === "1";
  const next = safeNextPath(Array.isArray(sp.next) ? sp.next[0] : sp.next);
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="space-y-10">
        {/* Its own navy hero, the same negative-margin pattern the homepage
            uses — a dedicated sign-in screen reads as an event, not just
            another settings page, and this is the one place in the product
            where that is the right amount of ceremony. */}
        <section className="-mx-5 -mt-10 overflow-hidden bg-navy-900 px-5 py-14 text-white relative sm:mx-0 sm:mt-0 sm:rounded-lg sm:border-2 sm:border-navy-900 sm:px-12 sm:py-16 sm:shadow-[8px_8px_0_var(--coral-pop)]">
          <div className="mx-auto max-w-sm text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-white"
            >
              <CompassMark className="h-8 w-8" />
              <span className="font-display text-3xl">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-2 text-sm text-navy-100">
              Your medical school application, organized.
            </p>

            <div className="mt-8 rounded-md border-2 border-navy-900 bg-surface p-6 text-left text-foreground shadow-[6px_6px_0_var(--coral-pop)] sm:p-7">
              <h1 className="text-xl font-semibold tracking-tight">
                Sign in to save your work
              </h1>
              <p className="mt-1 text-sm text-muted">
                Back it up and pick up on any device
              </p>

              {error === "invalid" && (
                <p className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
                  That sign-in link has already been used or has expired. Links
                  work once and last 15 minutes. Try signing in again below.
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
                  Sign in first and weSign in first, then head back to Pricing to upgrade.apos;ll bring you right back to Pricing to upgrade!
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
            You do not need an account. The dashboard works fully without one.
            Signing in only adds syncing, so your work follows you between
            devices.
          </p>

          <Link
            href="/dashboard"
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
    <div className="space-y-10">
      <ToolHeader
        kicker="Signed in · Synced to this account"
        title="Your account"
      >
        Signed in as <strong className="text-foreground">{user.email}</strong>.
        Your work is backed up here and follows you to any device!
      </ToolHeader>

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
          Payment received. This can take a few seconds to show up here, reload
          if it still says Free.
        </p>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="kicker">Your plan</p>
          <section className="stamp-coral rounded-md bg-surface p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl">Pro</h2>
              {user.isPro && (
                <span className="rounded-full bg-ok-soft px-3 py-1 text-xs font-semibold text-ok">
                  Active
                </span>
              )}
            </div>

            {user.isPro ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {planLine(user.proPlan, user.proUntil, user.hasSubscription)}{" "}
                  It follows your sign-in, not this browser, so it is there
                  wherever you sign in.
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
            <section className="rounded-md border-2 border-navy-900 bg-surface p-6">
              <h2 className="font-display text-3xl">Free trial</h2>
              {user.onTrial && user.trialEndsAt ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Your free trial is on. Every Pro feature is unlocked until{" "}
                  <strong className="text-foreground">
                    {fmtDateTime(user.trialEndsAt)}
                  </strong>
                  . After that it switches off on its own, nothing is charged,
                  and everything you entered stays yours.
                </p>
              ) : user.trialEndsAt ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Your free trial ended {fmtDate(user.trialEndsAt)}. Everything
                  you entered is still here and still free; Pro adds the full
                  analysis on top.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Try every Pro feature free for {TRIAL_DAYS} days: the full
                    Essay Map, the complete ranked list of what to write next,
                    and every insight. No card needed, and it ends on its own.
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
        </div>
        <div className="space-y-6">
          <p className="kicker">Your data</p>
          <section className="rounded-md border-2 border-navy-900 bg-surface p-6">
            <h2 className="font-semibold">What {SITE_NAME} stores for you</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>Your email address, used to sign you in.</li>
              <li>
                A copy of your dashboard: schools, essays, statuses, interviews,
                prep notes, activities and hours, personal statement, letters
                and your weekly planner, so it can follow you between devices.
              </li>
              <li>
                If you buy Pro: your plan, its end date, and Stripe&apos;s
                reference to your purchase. Your card details stay with Stripe.
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

          <ExportDataButtons />

          <form action={doSignOut}>
            <button
              type="submit"
              className="rounded-xl border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <details className="group rounded-md border-2 border-danger/40 bg-danger-soft p-6">
        <summary className="cursor-pointer list-none font-semibold text-danger marker:content-none [&::-webkit-details-marker]:hidden">
          Delete your account
          <span
            aria-hidden="true"
            className="ml-2 inline-block transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>
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
      </details>

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
