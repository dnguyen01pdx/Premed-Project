import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { REDEEM_MESSAGES, redeemPromoCode } from "@/lib/pro";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in first, then redeem your code." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = (body as Record<string, unknown>)?.code;
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Enter a code first." }, { status: 422 });
  }

  const result = await redeemPromoCode(user.id, code);
  if (!result.ok) {
    return NextResponse.json(
      { error: REDEEM_MESSAGES[result.reason] },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
