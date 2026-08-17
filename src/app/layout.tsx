import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CompassMark } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTACT_EMAIL, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "A free dashboard for the whole medical school application: log your activities, draft Work & Activities entries, track every secondary, and manage interviews.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
};

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

        <SiteHeader />

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
          {children}
        </main>

        <footer className="on-navy mt-auto bg-navy-900 text-navy-100">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-2.5 text-white">
                  <CompassMark className="h-6 w-6" />
                  <span className="text-base font-semibold tracking-tight">
                    {SITE_NAME}
                  </span>
                </span>
                <p className="mt-3 text-sm leading-relaxed">{SITE_TAGLINE}</p>
              </div>

              <nav aria-label="Footer">
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/primary" className="hover:text-white">
                      Primary application
                    </Link>
                  </li>
                  <li>
                    <Link href="/prompts" className="hover:text-white">
                      Browse prompts
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="hover:text-white">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/planner" className="hover:text-white">
                      Weekly planner
                    </Link>
                  </li>
                  <li>
                    <Link href="/secondaries" className="hover:text-white">
                      Secondaries
                    </Link>
                  </li>
                  <li>
                    <Link href="/interviews" className="hover:text-white">
                      Interviews
                    </Link>
                  </li>
                  <li>
                    <Link href="/submit" className="hover:text-white">
                      Submit a prompt
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-white">
                      What&apos;s free
                    </Link>
                  </li>
                  <li>
                    <Link href="/how-feedback-works" className="hover:text-white">
                      Our feedback policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="hover:text-white">
                      Your account
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-white">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-white">
                      About
                    </Link>
                  </li>
                  <li>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="hover:text-white"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="mt-10 space-y-3 border-t border-white/10 pt-6 text-xs leading-relaxed">
              <p className="max-w-3xl">
                Not affiliated with, endorsed by, or connected to the AAMC,
                AMCAS, or any medical school. Prompts are compiled from public
                sources and may be incomplete or out of date. Always confirm
                against the school&apos;s own application before you write.
              </p>
              <p>
                &copy; {new Date().getFullYear()} {SITE_NAME}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
