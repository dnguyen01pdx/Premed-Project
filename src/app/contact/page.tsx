import Link from "next/link";
import type { Metadata } from "next";
import { CopyEmailButton } from "@/components/CopyEmailButton";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME}: corrections, questions, anything else.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Contact
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Corrections, questions, bug reports, anything else — this reaches a
          real person, not a form that goes nowhere.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm font-semibold tracking-widest text-muted">
          EMAIL
        </p>
        <p className="mt-2 select-all text-lg font-medium">{CONTACT_EMAIL}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Open in email app
          </a>
          <CopyEmailButton email={CONTACT_EMAIL} />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          &ldquo;Open in email app&rdquo; only works if your browser has a
          default mail app set up. If nothing happens when you click it, use
          &ldquo;Copy email address&rdquo; and paste it into whatever you
          actually use — Gmail, Outlook, your phone.
        </p>
      </section>

      <p className="text-sm leading-relaxed text-muted">
        Found a secondary prompt that&apos;s wrong or out of date? The{" "}
        <Link
          href="/submit"
          className="text-accent underline underline-offset-2 hover:no-underline"
        >
          submit a prompt
        </Link>{" "}
        form is the fastest way to get it fixed.
      </p>
    </div>
  );
}
