import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Just "is anyone signed in", for the header's Sign in / Account label.
 * Deliberately says nothing else: no email, no Pro status.
 */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    { signedIn: !!user },
    { headers: { "cache-control": "no-store" } },
  );
}
