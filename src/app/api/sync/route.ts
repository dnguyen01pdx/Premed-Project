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
    planner: row?.planner ?? null,
    updatedAt: row?.updatedAt ?? null,
  });
}

async function saveSnapshot(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { tracker, prep, primary, planner } = (body ?? {}) as Record<
    string,
    unknown
  >;
  if (
    JSON.stringify({ tracker, prep, primary, planner }).length > MAX_BYTES
  ) {
    return NextResponse.json({ error: "That is too large to sync." }, { status: 413 });
  }

  // The server never interprets this JSON; the client owns its shape.
  await db
    .insert(trackerSnapshots)
    .values({ userId: user.id, tracker, prep, primary, planner, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: trackerSnapshots.userId,
      set: { tracker, prep, primary, planner, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  return saveSnapshot(req);
}

/**
 * navigator.sendBeacon only ever sends POST, and it is the one reliable way
 * to flush a pending edit when a tab is closing — a fetch() started in a
 * visibilitychange handler can be, and often is, cancelled by the browser
 * mid-navigation. Same body, same behavior as PUT.
 */
export async function POST(req: Request) {
  return saveSnapshot(req);
}
