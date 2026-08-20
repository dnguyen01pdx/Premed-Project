import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

/**
 * Shared by every /admin page. One password, one cookie, scoped to /admin
 * for all of them, so a page added later just calls isAdminAuthed() instead
 * of re-implementing this.
 */
export const ADMIN_COOKIE = "mda_admin";

/** Constant-time compare, so the password cannot be guessed by timing. */
function matches(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function isAdminAuthed(): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const jar = await cookies();
  const got = jar.get(ADMIN_COOKIE)?.value;
  return Boolean(got && matches(got, secret));
}

export async function adminSignIn(entered: string): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !matches(entered, secret)) return false;
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, entered, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  return true;
}
