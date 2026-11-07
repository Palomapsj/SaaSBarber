import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { type PanelRole, SESSION_COOKIE, encodeSession } from "@/lib/auth/session";
import { proxy } from "./proxy";

async function cookieFor(role: PanelRole) {
  return encodeSession({
    userId: "u",
    role,
    barbershopId: "bs_novaera",
    barberId: role === "barber" ? "brb_carlos" : null,
    name: "Teste",
    expiresAt: Date.now() + 3_600_000,
  });
}

async function visit(path: string, role?: PanelRole) {
  const request = new NextRequest(new URL(path, "http://localhost"));
  if (role) request.cookies.set(SESSION_COOKIE, await cookieFor(role));
  const response = await proxy(request);
  const location = response.headers.get("location");
  return location ? new URL(location).pathname + new URL(location).search : null;
}

describe("proxy (panel protection)", () => {
  beforeAll(() => vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters!!"));
  afterAll(() => vi.unstubAllEnvs());

  it("sends visitors without a session to the login, remembering where they were going", async () => {
    expect(await visit("/admin/servicos")).toBe("/login?next=%2Fadmin%2Fservicos");
    expect(await visit("/barbeiro/agenda")).toBe("/login?next=%2Fbarbeiro%2Fagenda");
  });

  it("lets each role into its own area", async () => {
    expect(await visit("/admin/profissionais", "admin")).toBeNull();
    expect(await visit("/barbeiro/horarios", "barber")).toBeNull();
  });

  it("keeps a barber out of the admin area and the admin out of the barber area", async () => {
    expect(await visit("/admin/agenda", "barber")).toBe("/barbeiro/agenda");
    expect(await visit("/barbeiro/servicos", "admin")).toBe("/admin/agenda");
  });

  it("opens the agenda for the area root", async () => {
    expect(await visit("/admin", "admin")).toBe("/admin/agenda");
    expect(await visit("/barbeiro", "barber")).toBe("/barbeiro/agenda");
  });

  it("skips the login page for someone already logged in", async () => {
    expect(await visit("/login", "barber")).toBe("/barbeiro/agenda");
    expect(await visit("/login")).toBeNull();
  });
});
