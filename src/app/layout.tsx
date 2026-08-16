import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "A free, searchable database of medical school secondary essay prompts, filterable by school, prompt type, and word or character limit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              {SITE_NAME}
            </Link>
            <nav className="flex gap-5 text-sm text-muted">
              <Link href="/prompts" className="hover:text-accent">
                Browse prompts
              </Link>
              <Link href="/schools" className="hover:text-accent">
                Schools
              </Link>
              <Link href="/how-feedback-works" className="hover:text-accent">
                Our policy
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
          {children}
        </main>

        <footer className="border-t border-line bg-surface">
          <div className="mx-auto max-w-5xl space-y-2 px-5 py-8 text-xs text-muted">
            <p>
              Not affiliated with, endorsed by, or connected to the AAMC, AMCAS,
              or any medical school. Prompts are compiled from public sources and
              may be incomplete or out of date. Always confirm against the
              school&apos;s own application before you write.
            </p>
            <p>
              &copy; {new Date().getFullYear()} {SITE_NAME}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
