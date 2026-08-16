import { NextResponse } from "next/server";
import { consumeSignInToken, setSessionCookie } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens a sign-in link.
 *
 * Always redirects rather than rendering, so the token never lingers in the
 * address bar of a page the user might screenshot or share.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/account?error=missing`);
  }

  const result = await consumeSignInToken(token);
  if (!result.ok) {
    return NextResponse.redirect(`${SITE_URL}/account?error=invalid`);
  }

  await setSessionCookie(result.sessionToken);
  return NextResponse.redirect(`${SITE_URL}/my-schools?signedin=1`);
}
