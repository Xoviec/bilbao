import { describe, it, expect } from "vitest";
import { safetyFillColor } from "../src/layers/safety";

describe("safetyFillColor", () => {
  it("domyślnie używa pola safety_index", () => {
    const expr = safetyFillColor() as unknown[];
    expect(expr[0]).toBe("case");
    // ["==", ["get","safety_index"], null]
    expect((expr[1] as unknown[])[1]).toEqual(["get", "safety_index"]);
    expect(expr[2]).toBe("#cccccc"); // kolor braku danych
  });

  it("obsługuje pole dzień/noc", () => {
    const expr = safetyFillColor("night_score") as unknown[];
    expect((expr[1] as unknown[])[1]).toEqual(["get", "night_score"]);
    const interp = expr[3] as unknown[];
    expect(interp[0]).toBe("interpolate");
    expect(interp[2]).toEqual(["get", "night_score"]);
  });
});
