import { MED_MAPPED } from "@/lib/config";
import { getLatestPosts } from "@/lib/medMapped";

/**
 * "From the blog" strip on the homepage. MD Atlas is where you do the work;
 * Med Mapped is where Dylan writes up how the road actually goes. Cards are
 * text-only on purpose: no stock thumbnails to go stale or look generated.
 */
export async function MedMappedPosts() {
  const posts = await getLatestPosts(3);

  return (
    <section aria-labelledby="blog-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="kicker">Field notes · {MED_MAPPED.name}</p>
          <h2
            id="blog-heading"
            className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Read the road ahead
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            {MED_MAPPED.name} is the blog that goes with MD Atlas: real fees,
            real dates, and free printables, written by a first-year med
            student.
          </p>
        </div>
        <a
          href={MED_MAPPED.url}
          className="text-sm font-semibold text-accent underline underline-offset-4 hover:no-underline"
        >
          All posts on medmapped.com
          <span aria-hidden="true"> &#8599;</span>
        </a>
      </div>

      <ul className="mt-8 grid gap-5 md:grid-cols-3">
        {posts.map((p, i) => (
          <li key={p.url}>
            <a
              href={p.url}
              className="lift flex h-full flex-col rounded-lg border-2 border-navy-900 bg-surface p-5"
            >
              <span className="kicker">
                {String(i + 1).padStart(2, "0")} /{" "}
                {p.date
                  ? new Date(p.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })
                  : "New"}
              </span>
              <span className="mt-3 font-display text-2xl leading-none text-navy-900">
                {p.title}
              </span>
              <span className="mt-3 text-sm leading-relaxed text-muted">
                {p.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
