import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  normalizeEmail,
  setSessionCookie,
  startSessionForEmail,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
};

function errorRedirect() {
  return NextResponse.redirect(`${SITE_URL}/account?error=google`);
}

/**
 * Finishes "Continue with Google": trade the authorization code for tokens,
 * confirm Google actually verified the email on the other end, then hand off
 * to the same startSessionForEmail() the magic-link flow uses. Signing in
 * with Google should not be a second, parallel notion of "a user" — it is
 * just a second way of proving you own an email address.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  jar.delete(GOOGLE_OAUTH_STATE_COOKIE);

  // Someone declined on Google's screen, or Google itself errored out.
  if (errorParam) {
    return errorRedirect();
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return errorRedirect();
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      "[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set — cannot complete Google sign-in.",
    );
    return errorRedirect();
  }

  const redirectUri = `${SITE_URL}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error(
        "[auth] Google token exchange failed:",
        tokenRes.status,
        await tokenRes.text().catch(() => ""),
      );
      return errorRedirect();
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return errorRedirect();
    }

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { authorization: `Bearer ${tokenData.access_token}` } },
    );
    if (!userRes.ok) {
      console.error("[auth] Google userinfo lookup failed:", userRes.status);
      return errorRedirect();
    }

    const userInfo = (await userRes.json()) as GoogleUserInfo;

    // Google can return an unverified email for some account types (e.g. a
    // Workspace admin hasn't confirmed it yet). Trusting an unverified email
    // for sign-in would let someone into an account they don't actually own.
    if (!userInfo.email || userInfo.email_verified !== true) {
      return errorRedirect();
    }

    const email = normalizeEmail(userInfo.email);
    if (!email) {
      return errorRedirect();
    }

    const { sessionToken } = await startSessionForEmail(email);
    await setSessionCookie(sessionToken);

    // Same landing spot the magic-link flow uses.
    return NextResponse.redirect(`${SITE_URL}/my-schools?signedin=1`);
  } catch (e) {
    console.error("[auth] Google sign-in failed:", e);
    return errorRedirect();
  }
}
