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

const NAV = [
  { href: "/prompts", label: "Browse prompts" },
  { href: "/overlap", label: "Find overlap" },
  { href: "/my-schools", label: "My schools" },
  { href: "/schools", label: "All schools" },
  { href: "/about", label: "About" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <header className="on-navy bg-navy-900 text-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-white"
            >
              {SITE_NAME}
            </Link>
            <nav aria-label="Main">
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-navy-100 hover:text-white hover:underline hover:underline-offset-4"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
          {children}
        </main>

        <footer className="on-navy mt-auto bg-navy-900 text-navy-100">
          <div className="mx-auto max-w-5xl space-y-3 px-5 py-10 text-xs leading-relaxed">
            <p className="max-w-3xl">
              Not affiliated with, endorsed by, or connected to the AAMC, AMCAS,
              or any medical school. Prompts are compiled from public sources and
              may be incomplete or out of date. Always confirm against the
              school&apos;s own application before you write.
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/how-feedback-works" className="hover:text-white">
                Our feedback policy
              </Link>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
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
