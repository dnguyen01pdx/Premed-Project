import { NextResponse } from "next/server";
import { signOutCurrentSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await signOutCurrentSession();
  return NextResponse.json({ ok: true });
}
