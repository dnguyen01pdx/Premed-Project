import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `Who built ${SITE_NAME}.`,
};

/**
 * Kept deliberately short. This page used to carry the site's mission
 * statement, its essay-writing policy, and a "found a wrong prompt" call to
 * action — all real content, but none of it about the person the page is
 * named after. Those live at /how-feedback-works and /submit now, linked
 * below in one line each instead of getting their own sections here.
 */
export default function AboutPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          About
        </h1>
      </header>

      <Reveal>
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid gap-0 sm:grid-cols-[minmax(0,280px)_1fr]">
            <div className="relative bg-navy-900">
              <Image
                src="/img/dylan-960.webp"
                alt="Dylan Nguyen"
                width={960}
                height={1200}
                sizes="(max-width: 640px) 100vw, 280px"
                priority
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-7 sm:p-9">
              <h2 className="text-2xl font-semibold tracking-tight">
                Hi, I&apos;m Dylan.
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed">
                <p>
                  I&apos;m a first-year med student at Brown&apos;s Warren
                  Alpert Medical School. I applied in the 2025-2026 cycle,
                  and somewhere between the spreadsheets and the secondaries
                  I realized the tool I wanted didn&apos;t exist. So I built
                  it. That&apos;s {SITE_NAME}.
                </p>
                <p>
                  My road here wasn&apos;t a straight line. I studied piano
                  performance at the University of Oregon (with a chemistry
                  minor on the side), and I still perform and compete
                  internationally. After college I worked as an ophthalmic
                  technician. That&apos;s where I first saw what a clinic
                  really feels like from the inside, and where I got pulled
                  into research and co-authored a neuro-ophthalmology case
                  report.
                </p>
                <p>
                  I took both the DAT (24) and the MCAT (517), and I was
                  accepted to dental school before realizing medicine was
                  where I belonged. If your path feels a little unusual too,
                  you&apos;re in good company.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <p className="text-sm leading-relaxed text-muted">
          Have a question, or found a prompt that&apos;s wrong?{" "}
          <Link
            href="/contact"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            Get in touch
          </Link>
          . Curious where the line is on AI feedback?{" "}
          <Link
            href="/how-feedback-works"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            Read the policy
          </Link>
          .
        </p>
      </Reveal>
    </div>
  );
}
