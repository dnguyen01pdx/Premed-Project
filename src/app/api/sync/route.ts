import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trackerSnapshots } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Guard against a runaway client filling the database. */
const MAX_BYTES = 512 * 1024;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [row] = await db
    .select()
    .from(trackerSnapshots)
    .where(eq(trackerSnapshots.userId, user.id))
    .limit(1);

  return NextResponse.json({
    email: user.email,
    tracker: row?.tracker ?? null,
    prep: row?.prep ?? null,
    primary: row?.primary ?? null,
    updatedAt: row?.updatedAt ?? null,
  });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { tracker, prep, primary } = (body ?? {}) as Record<string, unknown>;
  if (JSON.stringify({ tracker, prep, primary }).length > MAX_BYTES) {
    return NextResponse.json({ error: "That is too large to sync." }, { status: 413 });
  }

  // The server never interprets this JSON; the client owns its shape.
  await db
    .insert(trackerSnapshots)
    .values({ userId: user.id, tracker, prep, primary, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: trackerSnapshots.userId,
      set: { tracker, prep, primary, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
