import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { type Session, decodeSession, encodeSession } from "./session";

const session: Session = {
  userId: "usr_carlos",
  role: "barber",
  barbershopId: "bs_novaera",
  barberId: "brb_carlos",
  name: "Carlos Andrade",
  expiresAt: Date.now() + 3_600_000,
};

describe("panel session cookie", () => {
  beforeAll(() => vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters!!"));
  afterAll(() => vi.unstubAllEnvs());

  it("reads back what it wrote", async () => {
    expect(await decodeSession(await encodeSession(session))).toEqual(session);
  });

  it("rejects a cookie edited to become admin", async () => {
    const [payload, signature] = (await encodeSession(session)).split(".");
    const forged = btoa(atob(payload.replace(/-/g, "+").replace(/_/g, "/")).replace('"barber"', '"admin"'))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await decodeSession(`${forged}.${signature}`)).toBeNull();
  });

  it("rejects an expired session", async () => {
    const cookie = await encodeSession({ ...session, expiresAt: Date.now() - 1 });
    expect(await decodeSession(cookie)).toBeNull();
  });

  it("rejects a cookie signed with another secret", async () => {
    const cookie = await encodeSession(session);
    vi.stubEnv("SESSION_SECRET", "another-secret-with-at-least-32-characters");
    expect(await decodeSession(cookie)).toBeNull();
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters!!");
  });

  it("rejects missing and malformed cookies", async () => {
    expect(await decodeSession(undefined)).toBeNull();
    expect(await decodeSession("not-a-session")).toBeNull();
    expect(await decodeSession("a.b")).toBeNull();
  });

  it("refuses to work without a strong secret", async () => {
    vi.stubEnv("SESSION_SECRET", "short");
    await expect(encodeSession(session)).rejects.toThrow(/SESSION_SECRET/);
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters!!");
  });
});
