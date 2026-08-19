import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_TTL_SECONDS = 10 * 60;

/**
 * Kicks off "Continue with Google": stash a CSRF state value in a short-lived
 * cookie, then redirect to Google's consent screen. The callback checks the
 * state cookie matches what Google echoes back before trusting anything else
 * in the response.
 */
export async function GET() {
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
