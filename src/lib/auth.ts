import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "mda_session";
/** CSRF state cookie for the Google OAuth round trip. Short-lived on
 * purpose — it only needs to survive the redirect to Google and back. */
export const GOOGLE_OAUTH_STATE_COOKIE = "mda_g_state";

const TOKEN_TTL_MS = 15 * 60 * 1000; // sign-in links: short on purpose
const SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
/** Sign-in requests per email per hour. */
const REQUEST_LIMIT = 5;

/**
 * Hashing for anything token-shaped.
 *
 * Tokens are high-entropy random values, so a fast hash is correct here: there
 * is nothing to brute force. This is not password hashing and must never be
 * reused as such.
 */
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (email.length > 254) return null;
  return email;
}

/** True when this email has asked for too many links in the last hour. */
export async function isSignInRateLimited(email: string): Promise<boolean> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(authTokens)
    .where(
      and(eq(authTokens.email, email), gt(authTokens.createdAt, hourAgo)),
    );
  return (row?.n ?? 0) >= REQUEST_LIMIT;
}

/** Creates a sign-in token and returns the raw value, which is never stored. */
export async function createSignInToken(email: string): Promise<string> {
  const raw = newToken();
  await db.insert(authTokens).values({
    email,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });
  return raw;
}

/**
 * Finds or creates the user for this email and opens a new session for them.
 *
 * Shared by every sign-in method (magic link, Google) so "what happens once
 * we trust an email address" only has one implementation. Callers are
 * responsible for having verified the email first — this function trusts it.
 */
export async function startSessionForEmail(email: string): Promise<{
  userId: string;
  sessionToken: string;
}> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId = existing?.id;
  if (!userId) {
    const [created] = await db
      .insert(users)
      .values({ email })
      .returning({ id: users.id });
    userId = created.id;
  } else {
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, userId));
  }

  const sessionToken = newToken();
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(sessionToken),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return { userId, sessionToken };
}

/**
 * Redeems a sign-in token and starts a session.
 *
 * Single use: the token is marked consumed in the same statement that checks
 * it, so two clicks on the same link cannot both succeed.
 */
export async function consumeSignInToken(
  raw: string,
): Promise<{ ok: true; userId: string; sessionToken: string } | { ok: false }> {
  const tokenHash = hashToken(raw);

  const [claimed] = await db
    .update(authTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        isNull(authTokens.consumedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ email: authTokens.email });

  if (!claimed) return { ok: false };

  const { userId, sessionToken } = await startSessionForEmail(claimed.email);

  // Opportunistic cleanup; cheap and keeps the table from growing forever.
  await db.delete(authTokens).where(lt(authTokens.expiresAt, new Date()));

  return { ok: true, userId, sessionToken };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = { id: string; email: string };

/** Resolves the signed-in user, or null. Safe to call on any request. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [row] = await db
    .select({ id: users.id, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(raw)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function signOutCurrentSession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw)));
  }
  await clearSessionCookie();
}

/** Deletes the user and, by cascade, their sessions and synced data. */
export async function deleteAccount(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
  await clearSessionCookie();
}

/** Constant-time string compare, for anything secret-shaped. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
