import { describe, expect, it } from "vitest";
import type { PanelBarberInput } from "@/lib/api/types";
import { authenticate } from "./auth";
import { qualifiedBarbers } from "./catalog";
import { readDb } from "./db";
import { MockApiError } from "./errors";
import { barbersPage, createBarber, futureAppointmentCount, removeBarber, setBarberActive, updateBarber } from "./panelBarbers";

const shop = "bs_novaera";
const now = new Date("2026-09-21T13:00:00Z");
const bruno: PanelBarberInput = {
  name: "Bruno Teixeira",
  commissionPercent: 30,
  phone: "(11) 98765-0000",
  email: " Bruno@BarbeariaNovaEra.com ",
  serviceIds: ["svc_corte"],
  active: true,
};

const errorOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error as MockApiError;
  }
  throw new Error("expected an error");
};

describe("admin barbers (mock API)", () => {
  it("lists barbers with private fields, the plan and the services for the chips", () => {
    const page = barbersPage(readDb(), shop);
    expect(page.barbers.map((b) => b.name)).toEqual(["Carlos Andrade", "Rafael Alves", "Diego Ibra"]);
    expect(page.barbers[0]).toMatchObject({ commissionPercent: 40, phone: "11912345678", specialties: ["Cabelo", "Barba"] });
    expect(page.plan).toEqual({ name: "Pro", maxBarbers: 5 });
    expect(page.services).toHaveLength(4);
  });

  it("creates a barber, cleaning phone and e-mail, who clients can book right away", () => {
    const created = createBarber(readDb(), shop, bruno);
    expect(created).toMatchObject({ phone: "11987650000", email: "bruno@barbearianovaera.com", specialties: ["Cabelo"] });
    expect(qualifiedBarbers(readDb(), shop, ["svc_corte"]).map((b) => b.name)).toContain("Bruno Teixeira");
  });

  it("lets a new barber log in with their e-mail (simulation)", () => {
    createBarber(readDb(), shop, bruno);
    expect(authenticate(readDb(), "bruno@barbearianovaera.com", "barbearia123")?.role).toBe("barber");
  });

  it("refuses invalid fields, all at once", () => {
    const error = errorOf(() =>
      createBarber(readDb(), shop, { ...bruno, name: "Jo", commissionPercent: 120, phone: "1133334444", email: "x", serviceIds: [] }),
    );
    expect(error.code).toBe("VALIDATION");
    expect(Object.keys(error.details.fields as object).sort()).toEqual(["commissionPercent", "email", "name", "phone", "serviceIds"]);
  });

  it("refuses an e-mail already used by someone else", () => {
    const error = errorOf(() => createBarber(readDb(), shop, { ...bruno, email: "carlos@barbearianovaera.com" }));
    expect((error.details.fields as Record<string, string>).email).toBe("Este e-mail já está em uso");
  });

  it("stops at the plan limit", () => {
    createBarber(readDb(), shop, { ...bruno, email: "a@barbearianovaera.com" });
    createBarber(readDb(), shop, { ...bruno, email: "b@barbearianovaera.com" });
    expect(errorOf(() => createBarber(readDb(), shop, { ...bruno, email: "c@barbearianovaera.com" })).code).toBe("PLAN_LIMIT");
  });

  it("updates a barber (keeping their own e-mail) and switches them off", () => {
    const db = readDb();
    const carlos = barbersPage(db, shop).barbers[0];
    const updated = updateBarber(db, shop, carlos.id, { ...bruno, name: "Carlos A.", email: carlos.email, serviceIds: ["svc_barba"] });
    expect(updated).toMatchObject({ name: "Carlos A.", specialties: ["Barba"] });
    expect(setBarberActive(db, shop, carlos.id, false).active).toBe(false);
    expect(qualifiedBarbers(db, shop, ["svc_barba"]).some((b) => b.id === carlos.id)).toBe(false);
  });

  it("refuses to remove a barber with future appointments", () => {
    const error = errorOf(() => removeBarber(readDb(), shop, "brb_carlos", now));
    expect(error.code).toBe("HAS_FUTURE_APPOINTMENTS");
    expect(error.details.count).toBe(futureAppointmentCount(readDb(), shop, "brb_carlos", now));
  });

  it("removes a barber without future appointments", () => {
    const created = createBarber(readDb(), shop, bruno);
    removeBarber(readDb(), shop, created.id, now);
    expect(barbersPage(readDb(), shop).barbers.some((b) => b.id === created.id)).toBe(false);
  });
});
