import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { deleteAccount, getCurrentUser, signOutCurrentSession } from "@/lib/auth";
import { SITE_NAME } from "@/lib/config";
import { CompassMark } from "@/components/Logo";
import { ProPreviewToggle } from "@/components/ProPreviewToggle";
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
  await deleteAccount(user.id);
  redirect("/secondaries?deleted=1");
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
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
                  Google sign-in didn&apos;t go through. Nothing was saved or
                  changed — try again below.
                </p>
              )}

              <div className="mt-6">
                <GoogleSignInButton />
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
            You do not need an account — the dashboard works fully without
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

          <ProPreviewToggle />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Signed in as <strong className="text-foreground">{user.email}</strong>.
        </p>
      </header>

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

      <ProPreviewToggle />

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
