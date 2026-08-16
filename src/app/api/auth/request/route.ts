import { NextResponse } from "next/server";
import {
  createSignInToken,
  isSignInRateLimited,
  normalizeEmail,
} from "@/lib/auth";
import { sendSignInEmail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>)?.email;
  const email = typeof raw === "string" ? normalizeEmail(raw) : null;
  if (!email) {
    return NextResponse.json(
      { error: "That does not look like an email address." },
      { status: 422 },
    );
  }

  // Honeypot, same trick as the submission form.
  const hp = (body as Record<string, unknown>)?.website;
  if (typeof hp === "string" && hp.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  try {
    if (await isSignInRateLimited(email)) {
      return NextResponse.json(
        {
          error:
            "Too many sign-in links requested for that address. Check your inbox, or try again in an hour.",
        },
        { status: 429 },
      );
    }

    const token = await createSignInToken(email);
    const link = `${SITE_URL}/auth/verify?token=${encodeURIComponent(token)}`;
    const result = await sendSignInEmail(email, link);

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 503 });
    }

    // In development the link comes back so the flow is testable without an
    // email provider. This branch cannot run in production: sendSignInEmail
    // only returns devLink when NODE_ENV is not production.
    return NextResponse.json({ ok: true, devLink: result.devLink });
  } catch (e) {
    console.error("[auth] request failed:", e);
    return NextResponse.json(
      { error: "Something went wrong. Try again in a moment." },
      { status: 500 },
    );
  }
}
