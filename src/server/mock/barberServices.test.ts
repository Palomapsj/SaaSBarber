import { describe, expect, it } from "vitest";
import { signInForTest } from "@/test/mockApi";
import { barberServicesPage, setBarberPerformsService } from "./barberServices";
import { qualifiedBarbers } from "./catalog";
import { readDb, updateDb } from "./db";
import { MockApiError } from "./errors";
import { setServiceActive } from "./panelServices";

const shop = "bs_novaera";
const performedBy = (barberId: string) =>
  barberServicesPage(readDb(), shop, barberId).services.filter((s) => s.performed).map((s) => s.id);

const errorOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error as MockApiError;
  }
  throw new Error("expected an error");
};

const put = (serviceId: string, performed: boolean) =>
  fetch(`/api/mock/panel/me/services/${serviceId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ performed }),
  });

describe("barber services (mock API)", () => {
  it("lists the active services by category, marking the ones the barber performs", () => {
    const page = barberServicesPage(readDb(), shop, "brb_carlos");
    expect(page.categories.map((c) => c.name)).toEqual(["Cabelo", "Barba"]);
    expect(page.services.map((s) => [s.name, s.performed])).toEqual([
      ["Corte de cabelo", true],
      ["Corte + Sobrancelha", false],
      ["Barba completa", true],
      ["Barboterapia", false],
    ]);
  });

  it("hides inactive services and categories left empty", () => {
    updateDb((db) => setServiceActive(db, shop, "svc_barba", false));
    updateDb((db) => setServiceActive(db, shop, "svc_barboterapia", false));
    const page = barberServicesPage(readDb(), shop, "brb_carlos");
    expect(page.categories.map((c) => c.name)).toEqual(["Cabelo"]);
    expect(page.services.map((s) => s.id)).toEqual(["svc_corte", "svc_corte_sobrancelha"]);
  });

  it("checks and unchecks a service, and clients see the change", () => {
    updateDb((db) => setBarberPerformsService(db, shop, "brb_carlos", "svc_barboterapia", true));
    expect(performedBy("brb_carlos")).toEqual(["svc_corte", "svc_barba", "svc_barboterapia"]);
    expect(qualifiedBarbers(readDb(), shop, ["svc_barboterapia"]).map((b) => b.name)).toContain("Carlos Andrade");

    updateDb((db) => setBarberPerformsService(db, shop, "brb_carlos", "svc_corte", false));
    expect(performedBy("brb_carlos")).toEqual(["svc_barba", "svc_barboterapia"]);
    expect(qualifiedBarbers(readDb(), shop, ["svc_corte"]).map((b) => b.name)).not.toContain("Carlos Andrade");
  });

  it("refuses to uncheck the last active service", () => {
    updateDb((db) => setBarberPerformsService(db, shop, "brb_carlos", "svc_corte", false));
    const error = errorOf(() => updateDb((db) => setBarberPerformsService(db, shop, "brb_carlos", "svc_barba", false)));
    expect(error).toMatchObject({ status: 409, code: "LAST_SERVICE" });
    expect(performedBy("brb_carlos")).toEqual(["svc_barba"]);
  });

  it("counts only active services when checking the last one", () => {
    updateDb((db) => setServiceActive(db, shop, "svc_corte", false));
    const error = errorOf(() => updateDb((db) => setBarberPerformsService(db, shop, "brb_carlos", "svc_barba", false)));
    expect(error.code).toBe("LAST_SERVICE");
  });

  it("refuses unknown or inactive services", () => {
    expect(errorOf(() => setBarberPerformsService(readDb(), shop, "brb_carlos", "svc_nope", true)).status).toBe(404);
    updateDb((db) => setServiceActive(db, shop, "svc_barboterapia", false));
    expect(errorOf(() => setBarberPerformsService(readDb(), shop, "brb_carlos", "svc_barboterapia", true)).status).toBe(404);
  });

  it("changes only the barber of the session, and only for barbers", async () => {
    await signInForTest("barber", "brb_rafael");
    expect((await put("svc_barba", true)).status).toBe(200);
    expect(performedBy("brb_rafael")).toContain("svc_barba");
    expect(performedBy("brb_carlos")).toEqual(["svc_corte", "svc_barba"]);

    await signInForTest("admin");
    expect((await fetch("/api/mock/panel/me/services")).status).toBe(403);
    expect((await put("svc_barba", false)).status).toBe(403);
  });
});
