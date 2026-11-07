import { describe, expect, it } from "vitest";
import { NAME_ERROR, PHONE_ERROR, validateName, validatePhone } from "./customerValidation";

describe("validateName", () => {
  it.each(["Ana", "João Silva", "  Zé Maria "])("accepts %j", (name) => {
    expect(validateName(name)).toBeNull();
  });

  it.each(["", "  ", "Jo", "1234", "J. P"])("rejects %j", (name) => {
    expect(validateName(name)).toBe(NAME_ERROR);
  });
});

describe("validatePhone", () => {
  it("accepts a mobile number with area code", () => {
    expect(validatePhone("11987654321")).toBeNull();
  });

  it.each([
    ["landline", "1134567890"],
    ["missing area code", "987654321"],
    ["area code starting with 0", "01987654321"],
    ["mobile not starting with 9", "11887654321"],
    ["empty", ""],
  ])("rejects %s", (_, digits) => {
    expect(validatePhone(digits)).toBe(PHONE_ERROR);
  });
});
