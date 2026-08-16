import { randomBytes } from "node:crypto";

/**
 * Short, URL-safe, collision-resistant ID.
 *
 * Not a UUID on purpose: these show up in query params and logs, and 24 chars
 * of base62 is plenty of entropy for this scale.
 */
export function createId(): string {
  const alphabet =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = randomBytes(24);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
