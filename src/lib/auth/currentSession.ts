import { cookies } from "next/headers";
import { connection } from "next/server";
import { SESSION_COOKIE, type Session, decodeSession } from "@/lib/auth/session";

// Server-side read of the panel session. Reading cookies happens at request time, so callers
// must sit behind a <Suspense> boundary (Cache Components). proxy.ts already blocks access
// without a session; data functions still check the session themselves (never trust the UI).

export async function getSession(): Promise<Session | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  // Checking the expiry needs the current time, which only exists for a real request
  // (not while Next.js prefetches the page with cookies).
  await connection();
  return decodeSession(cookie, Date.now());
}
