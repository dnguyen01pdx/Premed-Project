import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { adminSignIn, isAdminAuthed } from "@/lib/admin";
import { effectiveIsPro } from "@/lib/auth";
import { listAccounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accounts",
  robots: { index: false, follow: false },
};

async function signIn(formData: FormData) {
  "use server";
  await adminSignIn(String(formData.get("password") ?? ""));
  revalidatePath("/admin/users");
}

const fmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

function proLabel(a: {
  isPro: boolean;
  proPlan: string | null;
  proUntil: Date | null;
  trialEndsAt: Date | null;
}): string {
  if (effectiveIsPro(a.isPro, a.proUntil)) return `Pro (${a.proPlan ?? "yes"})`;
  if (a.trialEndsAt && a.trialEndsAt > new Date()) return "On trial";
  if (a.isPro) return "Pro ended";
  return "Free";
}

export default async function AdminUsersPage() {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-warn/30 bg-warn-soft p-6 text-warn">
        <h1 className="text-lg font-semibold">Accounts page is not set up</h1>
        <p className="mt-2 text-sm leading-relaxed">
          Set an <code>ADMIN_PASSWORD</code> environment variable in Vercel,
          then redeploy.
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
        <h1 className="text-lg font-semibold">Accounts</h1>
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

  const accounts = await listAccounts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Everyone who has signed in to MD Atlas with Google ({accounts.length}{" "}
          total), newest first. Times are Eastern. &ldquo;Last sign-in&rdquo;
          updates each time they sign in, not on every visit.
        </p>
        <nav className="mt-2 flex gap-4 text-sm font-medium">
          <a
            href="/admin/promo"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            Promo codes &rarr;
          </a>
          <a
            href="/admin/submissions"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            Submissions &rarr;
          </a>
        </nav>
      </header>

      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No accounts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                <th scope="col" className="px-4 py-3 font-medium">Last sign-in</th>
                <th scope="col" className="px-4 py-3 font-medium">Plan</th>
                <th scope="col" className="px-4 py-3 font-medium">Backed up</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.email} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono">{a.email}</td>
                  <td className="whitespace-nowrap px-4 py-3">{fmt.format(a.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{fmt.format(a.lastSeenAt)}</td>
                  <td className="px-4 py-3">{proLabel(a)}</td>
                  <td className="px-4 py-3">{a.hasBackup ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
