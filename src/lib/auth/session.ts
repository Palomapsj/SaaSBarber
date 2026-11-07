// Panel session (admin and barber) kept in a signed cookie. Used by proxy.ts and by the server.
// Temporary until the authentication ADR: then the session comes from the API, the shape stays.
// Signed with HMAC-SHA256 (Web Crypto) so nobody can edit the cookie to become admin.

export type PanelRole = "admin" | "barber";

export type Session = {
  userId: string;
  role: PanelRole;
  /** The barbershop comes from the session, never from the URL (docs/adr/001). */
  barbershopId: string;
  /** Set when the user is a barber: their id in the barbershop. */
  barberId: string | null;
  name: string;
  /** Expiry, in milliseconds since epoch. */
  expiresAt: number;
};

export const SESSION_COOKIE = "panel_session";
export const SESSION_HOURS = 8;

const encoder = new TextEncoder();

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters (see .env.example).");
  }
  return value;
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function encodeSession(session: Session): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload)));
  return `${payload}.${toBase64Url(signature)}`;
}

/** The session if the cookie is well formed, correctly signed and not expired; otherwise null. */
export async function decodeSession(cookie: string | undefined, now = Date.now()): Promise<Session | null> {
  if (!cookie) return null;
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(signature) as Uint8Array<ArrayBuffer>,
      encoder.encode(payload),
    );
    if (!valid) return null;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Session;
    return session.expiresAt > now ? session : null;
  } catch {
    return null;
  }
}

/** Where each role lands after login, and where it is sent back to when it opens the wrong area. */
export function homeOf(role: PanelRole): string {
  return role === "admin" ? "/admin/agenda" : "/barbeiro/agenda";
}
