import "server-only";
import { handleMockApi } from "@/server/mock/router";
import { ApiError, readApiResponse } from "@/lib/api/http";
import type { Barber, Barbershop, PanelRole, PanelUser, ServiceCatalog } from "@/lib/api/types";

// API calls made on the server (pages, server actions). Locally they reach the mock API directly,
// without going through HTTP; for the .NET API they become fetch(`${API_URL}…`).

/**
 * On Vercel, pages, server actions and /api/mock run as separate functions, each with its own
 * copy of the mock data. Going through /api/mock over HTTP keeps one copy (e.g. a barber created
 * by the admin can log in).
 */
function deployedMockApi(): string | null {
  if (!process.env.VERCEL) return null;
  const host =
    process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
  return host ? `https://${host}/api/mock` : null;
}

async function serverRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const remote = deployedMockApi();
  const response = remote
    ? await fetch(`${remote}${path}`, { ...init, cache: "no-store" })
    : await handleMockApi(new Request(`http://mock.local/api/mock${path}`, init));
  return readApiResponse<T>(response);
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

/** The barbershop of a client URL, or null when the slug does not exist (docs/adr/001). */
export async function getBarbershopBySlug(slug: string): Promise<Barbershop | null> {
  try {
    return await serverRequest<Barbershop>(`/barbershops/by-slug/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function getServiceCatalog(barbershopId: string): Promise<ServiceCatalog> {
  return serverRequest(`/barbershops/${barbershopId}/services`);
}

/** Every barber of the barbershop, public fields only (used for names). */
export function getBarbers(barbershopId: string): Promise<Barber[]> {
  return serverRequest(`/barbershops/${barbershopId}/barbers`);
}

/** Panel login; null for wrong credentials. */
export async function authenticate(identifier: string, password: string): Promise<PanelUser | null> {
  try {
    return await serverRequest<PanelUser>("/auth/login", json({ identifier, password }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** Development shortcut behind the profile selector. */
export function demoUserFor(role: PanelRole): Promise<PanelUser> {
  return serverRequest(`/auth/demo-user?role=${role}`);
}
