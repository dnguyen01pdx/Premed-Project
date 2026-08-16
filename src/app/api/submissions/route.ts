import { NextResponse } from "next/server";
import {
  hashSubmitter,
  insertSubmission,
  isRateLimited,
  validateSubmission,
} from "@/lib/submissions";

export const runtime = "nodejs";

/** Best-effort client IP. Only ever used hashed, for rate limiting. */
function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a field hidden from humans. Anything that fills it is a bot.
  // Return success so the bot does not learn it was caught.
  const hp = (body as Record<string, unknown>)?.website;
  if (typeof hp === "string" && hp.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const result = validateSubmission(body);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  const submitterHash = hashSubmitter(clientIp(req));

  try {
    if (await isRateLimited(submitterHash)) {
      return NextResponse.json(
        {
          error:
            "That is a lot of submissions in one hour. Try again later, and thank you.",
        },
        { status: 429 },
      );
    }
    await insertSubmission(result.value, submitterHash);
  } catch {
    return NextResponse.json(
      { error: "Could not save that. Try again in a moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
