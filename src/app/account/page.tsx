import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { deleteAccount, getCurrentUser, signOutCurrentSession } from "@/lib/auth";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

async function doSignOut() {
  "use server";
  await signOutCurrentSession();
  redirect("/my-schools");
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
  redirect("/my-schools?deleted=1");
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
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
        {error === "invalid" && (
          <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
            That sign-in link has already been used or has expired. Links work
            once and last 15 minutes. Request a fresh one from your dashboard.
          </p>
        )}
        {error === "missing" && (
          <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
            That link was incomplete. Try requesting a new one.
          </p>
        )}
        <p className="leading-relaxed text-muted">
          You are not signed in. You do not need to be — the dashboard works
          without an account. Signing in only adds syncing across devices.
        </p>
        <Link
          href="/my-schools"
          className="inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          Go to my dashboard
        </Link>
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
        Questions:{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-accent underline underline-offset-2 hover:no-underline"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
