import { NextResponse } from "next/server";

/**
 * Retired. This was a temporary diagnostic used once to debug a production
 * migration gap (see AGENTS.md history) — it only ever returned schema
 * metadata, never credentials, but it has no reason to keep existing.
 * Safe to delete this whole folder next time someone is touching this area.
 */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
