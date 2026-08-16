import "server-only";
import { CONTACT_EMAIL, SITE_NAME } from "./config";

/**
 * Email sending, with a deliberate fallback.
 *
 * If RESEND_API_KEY is not set, we do not pretend to send. In development the
 * sign-in link is printed to the server log so the whole flow is testable with
 * zero setup. In production a missing key is a hard error, because silently
 * swallowing a sign-in email would look to the user like the site is broken
 * with no explanation.
 */

export type SendResult =
  | { ok: true; devLink?: string }
  | { ok: false; reason: string };

const FROM = process.env.EMAIL_FROM ?? `${SITE_NAME} <onboarding@resend.dev>`;

export async function sendSignInEmail(
  to: string,
  link: string,
): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[auth] Sign-in link for ${to}:\n${link}\n`);
      return { ok: true, devLink: link };
    }
    return {
      ok: false,
      reason:
        "Email is not configured yet, so sign-in links cannot be sent. Try again later.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: `Your ${SITE_NAME} sign-in link`,
        text: [
          `Click to sign in to ${SITE_NAME}:`,
          "",
          link,
          "",
          "This link works once and expires in 15 minutes.",
          "",
          `If you did not ask for this, ignore it. Nothing happens until the link is opened. Questions: ${CONTACT_EMAIL}`,
        ].join("\n"),
        html: signInHtml(link),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[auth] Resend rejected the request:", res.status, detail);
      return {
        ok: false,
        reason: "Could not send the email. Try again in a moment.",
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("[auth] Email send failed:", e);
    return {
      ok: false,
      reason: "Could not reach the email service. Try again in a moment.",
    };
  }
}

function signInHtml(link: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f8fc;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#16203a">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #d9e1ee;border-radius:16px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px;letter-spacing:-0.01em">Sign in to ${SITE_NAME}</h1>
    <p style="margin:0 0 24px;line-height:1.6">Click the button below. It works once and expires in 15 minutes.</p>
    <a href="${link}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600">Sign in</a>
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#55607a">
      If the button does not work, paste this into your browser:<br>
      <span style="word-break:break-all">${link}</span>
    </p>
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#55607a">
      If you did not ask for this, ignore it. Nothing happens until the link is opened.
    </p>
  </div>
</body></html>`;
}
