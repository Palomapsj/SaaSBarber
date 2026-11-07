import { describe, expect, it } from "vitest";
import type { PanelServiceInput } from "@/lib/api/types";
import { clientCatalog, qualifiedBarbers } from "./catalog";
import { readDb } from "./db";
import type { MockApiError } from "./errors";
import { createService, servicesPage, setServiceActive, updateService } from "./panelServices";

const shop = "bs_novaera";
const hidratacao: PanelServiceInput = {
  name: "  Hidratação ",
  categoryName: "Tratamentos",
  durationMinutes: 20,
  priceCents: 3000,
  barberIds: ["brb_carlos"],
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

describe("admin services (mock API)", () => {
  it("lists services with who performs them, categories and barbers", () => {
    const page = servicesPage(readDb(), shop);
    expect(page.services.find((s) => s.id === "svc_corte")?.barberIds).toEqual(["brb_carlos", "brb_rafael"]);
    expect(page.categories.map((c) => c.name)).toEqual(["Cabelo", "Barba"]);
    expect(page.barbers.map((b) => b.name)).toEqual(["Carlos Andrade", "Rafael Alves", "Diego Ibra"]);
  });

  it("creates a service in a new category and assigns it to the chosen barbers", () => {
    const created = createService(readDb(), shop, hidratacao);
    expect(created).toMatchObject({ name: "Hidratação", priceCents: 3000, barberIds: ["brb_carlos"] });
    expect(servicesPage(readDb(), shop).categories.map((c) => c.name)).toContain("Tratamentos");
    expect(readDb().barbers[shop].find((b) => b.id === "brb_carlos")?.serviceIds).toContain(created.id);
  });

  it("reuses an existing category regardless of letter case", () => {
    const created = createService(readDb(), shop, { ...hidratacao, categoryName: "cabelo" });
    expect(created.categoryId).toBe("cat_cabelo");
  });

  it("hides from clients a service nobody performs, and shows it once a barber is assigned", () => {
    const created = createService(readDb(), shop, { ...hidratacao, barberIds: [] });
    expect(clientCatalog(readDb(), shop).services.some((s) => s.id === created.id)).toBe(false);
    expect(clientCatalog(readDb(), shop).categories.map((c) => c.name)).not.toContain("Tratamentos");
    updateService(readDb(), shop, created.id, { ...hidratacao, barberIds: ["brb_diego"] });
    expect(clientCatalog(readDb(), shop).services.some((s) => s.id === created.id)).toBe(true);
  });

  it("hides an inactive service from clients and from barber matching", () => {
    setServiceActive(readDb(), shop, "svc_corte", false);
    expect(clientCatalog(readDb(), shop).services.some((s) => s.id === "svc_corte")).toBe(false);
    expect(qualifiedBarbers(readDb(), shop, ["svc_corte"])).toEqual([]);
  });

  it("moves a service to another category and drops the empty one", () => {
    const created = createService(readDb(), shop, hidratacao);
    updateService(readDb(), shop, created.id, { ...hidratacao, categoryName: "Barba" });
    expect(servicesPage(readDb(), shop).categories.map((c) => c.name)).toEqual(["Cabelo", "Barba"]);
  });

  it("updates who performs a service from this screen (same data as Profissionais)", () => {
    updateService(readDb(), shop, "svc_barboterapia", {
      ...hidratacao,
      name: "Barboterapia",
      categoryName: "Barba",
      barberIds: ["brb_carlos"],
    });
    const barbers = readDb().barbers[shop];
    expect(barbers.find((b) => b.id === "brb_carlos")?.serviceIds).toContain("svc_barboterapia");
    expect(barbers.find((b) => b.id === "brb_diego")?.serviceIds).not.toContain("svc_barboterapia");
  });

  it("refuses invalid fields and duplicate names", () => {
    const invalid = errorOf(() =>
      createService(readDb(), shop, { ...hidratacao, name: "Ab", categoryName: "", durationMinutes: 3, priceCents: -1 }),
    );
    expect(Object.keys(invalid.details.fields as object).sort()).toEqual(["categoryName", "durationMinutes", "name", "priceCents"]);
    const duplicate = errorOf(() => createService(readDb(), shop, { ...hidratacao, name: "corte de cabelo" }));
    expect((duplicate.details.fields as Record<string, string>).name).toBe("Já existe um serviço com este nome");
  });
});
