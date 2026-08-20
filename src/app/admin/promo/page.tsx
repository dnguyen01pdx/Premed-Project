import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { adminSignIn, isAdminAuthed } from "@/lib/admin";
import { createPromoCode, deletePromoCode, listPromoCodes } from "@/lib/pro";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promo codes",
  robots: { index: false, follow: false },
};

async function signIn(formData: FormData) {
  "use server";
  await adminSignIn(String(formData.get("password") ?? ""));
  revalidatePath("/admin/promo");
}

async function create(formData: FormData) {
  "use server";
  if (!(await isAdminAuthed())) return;

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return;

  const label = String(formData.get("label") ?? "").trim();
  const maxRaw = String(formData.get("maxRedemptions") ?? "").trim();
  const maxRedemptions = maxRaw ? Number.parseInt(maxRaw, 10) : null;

  await createPromoCode({
    code,
    label: label || undefined,
    maxRedemptions:
      maxRedemptions !== null && Number.isFinite(maxRedemptions)
        ? maxRedemptions
        : null,
  });
  revalidatePath("/admin/promo");
}

async function remove(formData: FormData) {
  "use server";
  if (!(await isAdminAuthed())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deletePromoCode(id);
  revalidatePath("/admin/promo");
}

export default async function AdminPromoPage() {
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
        <h1 className="text-lg font-semibold">Promo codes</h1>
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

  const codes = await listPromoCodes();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Promo codes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          A code redeemed on{" "}
          <a
            href="/account"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            /account
          </a>{" "}
          grants Pro to that signed-in account immediately. It never touches
          Stripe or a card. Give a code a redemption limit to cap how many
          people can use it, or leave it blank for unlimited.
        </p>
        <a
          href="/admin/submissions"
          className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
        >
          Submissions &rarr;
        </a>
      </header>

      <form
        action={create}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-5"
      >
        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Code
          </label>
          <input
            id="code"
            name="code"
            required
            placeholder="BETA2026"
            autoComplete="off"
            className="mt-1 w-40 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-muted"
          />
        </div>
        <div>
          <label htmlFor="label" className="block text-sm font-medium">
            Note (internal only)
          </label>
          <input
            id="label"
            name="label"
            placeholder="Beta testers, batch 1"
            autoComplete="off"
            className="mt-1 w-56 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="maxRedemptions" className="block text-sm font-medium">
            Redemption limit
          </label>
          <input
            id="maxRedemptions"
            name="maxRedemptions"
            type="number"
            min={1}
            placeholder="Unlimited"
            className="mt-1 w-32 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          Create code
        </button>
      </form>

      {codes.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No codes yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {codes.map((c) => {
            const exhausted =
              c.maxRedemptions !== null && c.redemptionCount >= c.maxRedemptions;
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface p-5"
              >
                <span className="font-mono text-base font-semibold tracking-wide">
                  {c.code}
                </span>
                <span className="text-sm text-muted">
                  {c.redemptionCount}
                  {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ""}{" "}
                  redeemed
                  {exhausted ? ", fully redeemed" : ""}
                </span>
                {c.label && (
                  <span className="text-sm text-muted">{c.label}</span>
                )}
                <form action={remove} className="ml-auto">
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
                  >
                    Delete
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
