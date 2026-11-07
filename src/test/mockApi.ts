import { vi } from "vitest";
import { SESSION_COOKIE, encodeSession } from "@/lib/auth/session";
import type { PanelRole } from "@/lib/api/types";
import { resetMockDb } from "@/server/mock/db";
import { handleMockApi } from "@/server/mock/router";

// Test wiring: lib/api's fetch calls go straight to the mock API router (no network), with a
// fresh database for every test and an optional panel session cookie.

export const TEST_SESSION_SECRET = "test-secret-with-at-least-32-characters!!";

let sessionCookie: string | null = null;

export function installMockApi(): void {
  vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input instanceof Request ? input.url : input), "http://localhost");
    const headers = new Headers(init?.headers);
    if (sessionCookie) headers.set("cookie", `${SESSION_COOKIE}=${encodeURIComponent(sessionCookie)}`);
    return handleMockApi(new Request(url, { ...init, headers }));
  });
}

export function resetMockApi(): void {
  resetMockDb();
  sessionCookie = null;
}

/** Calls to /panel/… are made as this user (demo admin, or Carlos for barbers). */
export async function signInForTest(role: PanelRole, barberId = "brb_carlos"): Promise<void> {
  sessionCookie = await encodeSession({
    userId: role === "admin" ? "usr_admin" : `usr_${barberId}`,
    role,
    barbershopId: "bs_novaera",
    barberId: role === "barber" ? barberId : null,
    name: role === "admin" ? "Dono Nova Era" : "Carlos Andrade",
    expiresAt: Date.now() + 3_600_000,
  });
}
