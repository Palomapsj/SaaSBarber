import { describe, expect, it } from "vitest";
import { centsToPriceInput, parsePriceToCents, validateDuration } from "./service";

describe("parsePriceToCents", () => {
  it.each([
    ["45", 4500],
    ["45,5", 4550],
    ["45,50", 4550],
    ["45.50", 4550],
    ["R$ 45", 4500],
    ["1.234,56", 123456],
    ["0", 0],
  ])("%s → %i", (text, cents) => {
    expect(parsePriceToCents(text)).toBe(cents);
  });

  it.each(["", "abc", "45,555", "-5", "4 5"])("refuses %j", (text) => {
    expect(Number.isNaN(parsePriceToCents(text))).toBe(true);
  });
});

describe("centsToPriceInput", () => {
  it("shows whole prices without cents and others with a comma", () => {
    expect(centsToPriceInput(4500)).toBe("45");
    expect(centsToPriceInput(4550)).toBe("45,50");
  });
});

describe("validateDuration", () => {
  it("accepts 5 to 240 whole minutes", () => {
    expect(validateDuration(5)).toBeNull();
    expect(validateDuration(240)).toBeNull();
    expect(validateDuration(4)).not.toBeNull();
    expect(validateDuration(241)).not.toBeNull();
    expect(validateDuration(Number.NaN)).not.toBeNull();
  });
});
