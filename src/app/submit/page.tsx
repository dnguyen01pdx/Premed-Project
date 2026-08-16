import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";
import { listSchools } from "@/lib/queries";
import { SITE_NAME } from "@/lib/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Submit a prompt",
  description:
    "Received a secondary? Send us the prompt so the next applicant does not have to guess.",
};

export default async function SubmitPage() {
  const schools = await listSchools();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Send us a prompt
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Most schools never publish their secondary questions. The only people
          who know what they actually ask are the applicants who received one.
          If that is you, this is the single most useful thing you can do for
          whoever applies next.
        </p>
      </header>

      <section className="rounded-2xl border border-navy-100 bg-accent-soft p-5 text-sm leading-relaxed">
        <p>
          <strong>What happens to it:</strong> submissions are reviewed by a
          person before anything appears on {SITE_NAME}. Nothing you send goes
          live automatically, and a prompt only loses its &ldquo;not
          verified&rdquo; label once it has been checked against the
          school&apos;s own materials.
        </p>
      </section>

      <SubmitForm
        schools={schools.map((s) => ({ slug: s.slug, name: s.name }))}
      />
    </div>
  );
}
