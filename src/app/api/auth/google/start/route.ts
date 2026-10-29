import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  safeNextPath,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_TTL_SECONDS = 10 * 60;

/**
 * Kicks off "Continue with Google": stash a CSRF state value in a short-lived
 * cookie, then redirect to Google's consent screen. The callback checks the
 * state cookie matches what Google echoes back before trusting anything else
 * in the response.
 */
export async function GET(req: Request) {
  // The site answers on more than one host (the Vercel URL and
  // atlas.medmapped.com), but Google only knows the SITE_URL callback, and
  // the state cookie must be set on the same host that callback runs on.
  // So start the flow on SITE_URL's host whatever host the click came from.
  // `hop` stops a loop if the platform ever reports a host we don't expect.
  const canonical = new URL(SITE_URL);
  const here = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? here.host;
  const next = safeNextPath(here.searchParams.get("next"));
  if (host !== canonical.host && !here.searchParams.has("hop")) {
    const hop = new URL("/api/auth/google/start", canonical.origin);
    hop.searchParams.set("hop", "1");
    if (next) hop.searchParams.set("next", next);
    return NextResponse.redirect(hop.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Same posture as sendSignInEmail's missing-RESEND_API_KEY case: fail
    // loudly in server logs rather than sending someone into a dead redirect.
    console.error(
      "[auth] GOOGLE_CLIENT_ID is not set — cannot start Google sign-in.",
    );
    return NextResponse.redirect(`${SITE_URL}/account?error=google`);
  }

  const state = randomBytes(24).toString("base64url");
  const jar = await cookies();
  jar.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  });
  // Lets "Sign in to save" on a tracking page land you back on that page.
  if (next) {
    jar.set(GOOGLE_OAUTH_NEXT_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: STATE_TTL_SECONDS,
    });
  } else {
    jar.delete(GOOGLE_OAUTH_NEXT_COOKIE);
  }

  const redirectUri = `${SITE_URL}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl.toString());
}
