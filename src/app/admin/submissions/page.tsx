import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { Badge } from "@/components/Badge";
import { adminSignIn, isAdminAuthed } from "@/lib/admin";
import {
  listSubmissions,
  setSubmissionStatus,
} from "@/lib/submissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submissions",
  robots: { index: false, follow: false },
};

async function signIn(formData: FormData) {
  "use server";
  await adminSignIn(String(formData.get("password") ?? ""));
  revalidatePath("/admin/submissions");
}

async function decide(formData: FormData) {
  "use server";
  if (!(await isAdminAuthed())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;
  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return;
  }
  await setSubmissionStatus(id, status);
  revalidatePath("/admin/submissions");
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-warn/30 bg-warn-soft p-6 text-warn">
        <h1 className="text-lg font-semibold">Review page is not set up</h1>
        <p className="mt-2 text-sm leading-relaxed">
          Set an <code>ADMIN_PASSWORD</code> environment variable in Vercel,
          then redeploy. Until then this page stays locked for everyone,
          including you.
        </p>
      </div>
    );
  }

  if (!(await isAdminAuthed())) {
    return (
      <form
        action={signIn}
        className="mx-auto max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6"
      >
        <h1 className="text-lg font-semibold">Submissions</h1>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          Open
        </button>
      </form>
    );
  }

  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const filter =
    raw === "approved" || raw === "rejected" || raw === "all" ? raw : "pending";

  const rows = await listSubmissions(filter);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Submissions</h1>
        <p className="mt-2 text-sm text-muted">
          Approving marks a submission as good to copy into{" "}
          <code>data/schools.json</code>. Nothing here is published
          automatically. The JSON file stays the source of truth.
        </p>
        <a
          href="/admin/promo"
          className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
        >
          Promo codes &rarr;
        </a>
      </header>

      <nav className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/submissions?status=${s}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm capitalize ${
              filter === s
                ? "border-accent bg-accent text-on-accent"
                : "border-line-strong bg-surface hover:border-accent hover:text-accent"
            }`}
          >
            {s}
          </a>
        ))}
      </nav>

      {rows.length === 0 && (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          Nothing {filter === "all" ? "here" : filter} right now.
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {r.knownSchoolName ?? r.schoolNameRaw}
              </span>
              {!r.schoolSlug && <Badge tone="warn">Unmatched school</Badge>}
              <Badge
                tone={
                  r.status === "approved"
                    ? "ok"
                    : r.status === "rejected"
                      ? "danger"
                      : "neutral"
                }
              >
                {r.status}
              </Badge>
              <span className="text-xs text-muted">
                {r.cycleYear} ·{" "}
                {r.limitUnit === "none"
                  ? "no stated limit"
                  : `${r.limitValue} ${r.limitUnit}`}
              </span>
            </div>

            <p className="mt-3 text-[15px] leading-relaxed">{r.promptText}</p>

            {r.note && (
              <p className="mt-2 text-sm text-muted">Note: {r.note}</p>
            )}
            {r.contactEmail && (
              <p className="mt-1 text-sm text-muted">
                Contact: {r.contactEmail}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {new Date(r.createdAt).toLocaleString()}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {r.status !== "approved" && (
                <form action={decide}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button
                    type="submit"
                    className="rounded-lg bg-ok px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Approve
                  </button>
                </form>
              )}
              {r.status !== "rejected" && (
                <form action={decide}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button
                    type="submit"
                    className="rounded-lg border border-danger/40 px-3.5 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
                  >
                    Reject
                  </button>
                </form>
              )}
              {r.status !== "pending" && (
                <form action={decide}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="pending" />
                  <button
                    type="submit"
                    className="rounded-lg border border-line-strong px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent"
                  >
                    Back to pending
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
