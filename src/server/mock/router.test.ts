import { describe, expect, it } from "vitest";
import { signInForTest } from "@/test/mockApi";

// Through HTTP, as the screens call it (fetch is wired to the router in src/test/setup.ts).
const get = (path: string) => fetch(`/api/mock${path}`);
const send = (method: string, path: string, body: unknown) =>
  fetch(`/api/mock${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("mock API router", () => {
  it("finds a barbershop by slug, ignoring letter case, and answers 404 for unknown ones", async () => {
    expect((await (await get("/barbershops/by-slug/NovaEra")).json()).name).toBe("Barbearia Nova Era");
    const missing = await get("/barbershops/by-slug/naoexiste");
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe("NOT_FOUND");
  });

  it("lists only active barbers who perform every chosen service, without private fields", async () => {
    const barbers = await (await get("/barbershops/bs_novaera/barbers?serviceIds=svc_corte,svc_barba")).json();
    expect(barbers.map((b: { name: string }) => b.name)).toEqual(["Carlos Andrade"]);
    expect(barbers[0].specialties).toEqual(["Cabelo", "Barba"]);
    expect(barbers[0]).not.toHaveProperty("phone");
    expect(barbers[0]).not.toHaveProperty("email");
    expect(barbers[0]).not.toHaveProperty("commissionPercent");
  });

  it("requires a session for the panel and the right profile", async () => {
    expect((await get("/panel/agenda?date=2026-09-22")).status).toBe(401);
    await signInForTest("barber");
    expect((await get("/panel/agenda?date=2026-09-22")).status).toBe(403);
    expect((await get("/panel/barbers")).status).toBe(403);
    expect((await get("/panel/me/agenda?date=2026-09-22")).status).toBe(200);
    await signInForTest("admin");
    expect((await get("/panel/agenda?date=2026-09-22")).status).toBe(200);
    expect((await get("/panel/me/agenda?date=2026-09-22")).status).toBe(403);
  });

  it("logs in with the demo password, by e-mail or phone", async () => {
    expect((await (await send("POST", "/auth/login", { identifier: "Dono@BarbeariaNovaEra.com", password: "barbearia123" })).json()).role).toBe("admin");
    const barber = await (await send("POST", "/auth/login", { identifier: "(11) 91234-5678", password: "barbearia123" })).json();
    expect(barber.barberId).toBe("brb_carlos");
    expect((await send("POST", "/auth/login", { identifier: "dono@barbearianovaera.com", password: "errada" })).status).toBe(401);
  });

  it("answers 404 for unknown endpoints and 400 for bad dates", async () => {
    expect((await get("/nothing/here")).status).toBe(404);
    await signInForTest("admin");
    expect((await get("/panel/agenda?date=amanha")).status).toBe(400);
  });
});
