import { describe, expect, it } from "vitest";
import { EMPTY_BARBER_FORM, barberSummary, toBarberInput, validateBarberForm } from "./barberForm";

const valid = {
  name: "Bruno Teixeira",
  commission: "30",
  phone: "11987650000",
  email: "bruno@barbearianovaera.com",
  serviceIds: ["svc_corte"],
  active: true,
};

describe("barber form", () => {
  it("accepts a complete form", () => {
    expect(validateBarberForm(valid)).toEqual({});
  });

  it("flags every missing field of an empty form", () => {
    expect(Object.keys(validateBarberForm(EMPTY_BARBER_FORM)).sort()).toEqual([
      "commissionPercent",
      "email",
      "name",
      "phone",
      "serviceIds",
    ]);
  });

  it.each(["101", "", "-1"])("refuses the commission %j", (commission) => {
    expect(validateBarberForm({ ...valid, commission }).commissionPercent).toBeDefined();
  });

  it("converts the commission to a number for the API", () => {
    expect(toBarberInput({ ...valid, name: "  Bruno  " })).toMatchObject({ name: "Bruno", commissionPercent: 30 });
  });

  it("summarizes a barber like the prototype list", () => {
    expect(
      barberSummary({
        id: "b",
        name: "Carlos",
        specialties: ["Cabelo", "Barba"],
        serviceIds: [],
        active: true,
        commissionPercent: 40,
        phone: "",
        email: "",
      }),
    ).toBe("Cabelo · Barba · 40% comissão");
  });
});
