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
                  I&apos;m an incoming first-year medical student at the Warren
                  Alpert Medical School of Brown University. I built{" "}
                  {SITE_NAME} because I applied in the most recent cycle and
                  wanted the tool I didn&apos;t have.
                </p>
                <p>
                  My path here was not the standard one. I did my undergrad at
                  the University of Oregon, where I earned a Bachelor of Music
                  in Piano Performance with a chemistry minor. I still perform
                  and compete internationally. Before medical school I worked
                  as an ophthalmic technician, which is where I learned what a
                  clinic actually feels like from the inside, and where I got
                  involved in research and co-authored a case report in
                  neuro-ophthalmology.
                </p>
                <p>
                  I scored a 517 on the MCAT and a 24 on the DAT. I was
                  accepted to dental school before deciding medicine was the
                  right fit.
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
