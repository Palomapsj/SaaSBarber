import { describe, expect, it } from "vitest";
import { afterLoginPath } from "./redirects";

describe("afterLoginPath", () => {
  it("returns to the requested page inside the user's area", () => {
    expect(afterLoginPath("/admin/servicos", "admin")).toBe("/admin/servicos");
    expect(afterLoginPath("/barbeiro/horarios", "barber")).toBe("/barbeiro/horarios");
  });

  it("goes home when there is nothing to return to", () => {
    expect(afterLoginPath(null, "admin")).toBe("/admin/agenda");
    expect(afterLoginPath("", "barber")).toBe("/barbeiro/agenda");
  });

  it.each([
    ["another site", "https://evil.example/admin/"],
    ["a protocol-relative link", "//evil.example/admin/agenda"],
    ["a backslash trick", "/admin/\\evil.example"],
    ["the other role's area", "/barbeiro/agenda"],
    ["a client page", "/novaera"],
  ])("ignores %s", (_, next) => {
    expect(afterLoginPath(next, "admin")).toBe("/admin/agenda");
  });
});
