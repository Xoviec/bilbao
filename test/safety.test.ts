import { describe, it, expect } from "vitest";
import { safetyFillColor, rampStops } from "../src/layers/safety";
import { METRICS, RAMP } from "../src/config";

describe("safetyFillColor", () => {
  it("obszary bez danych dostają kolor neutralny", () => {
    const expr = safetyFillColor() as unknown[];
    expect(expr[0]).toBe("case");
    expect((expr[1] as unknown[])[1]).toEqual(["get", "perception"]);
    expect(expr[2]).toBe("#cccccc"); // kolor braku danych
  });

  it("obsługuje obie metryki", () => {
    for (const id of ["perception", "crime_rate"] as const) {
      const expr = safetyFillColor(id) as unknown[];
      expect((expr[1] as unknown[])[1]).toEqual(["get", METRICS[id].field]);
    }
  });
});

describe("rampStops", () => {
  it("percepcja: wyżej = zieleń", () => {
    const stops = rampStops(METRICS.perception);
    expect(stops[0][1]).toBe(RAMP[0]); // dolny kraniec = czerwień
    expect(stops[stops.length - 1][1]).toBe(RAMP[RAMP.length - 1]); // górny = zieleń
  });

  it("przestępczość: skala odwrócona, bo wyżej = gorzej", () => {
    // Ten sam zielony kolor nie może znaczyć raz "dobrze", raz "źle".
    const stops = rampStops(METRICS.crime_rate);
    expect(stops[0][1]).toBe(RAMP[RAMP.length - 1]); // mało przestępstw = zieleń
    expect(stops[stops.length - 1][1]).toBe(RAMP[0]); // dużo = czerwień
  });

  it("skala pokrywa zadeklarowany zakres metryki", () => {
    for (const m of Object.values(METRICS)) {
      const stops = rampStops(m);
      expect(stops[0][0]).toBe(m.domain[0]);
      expect(stops[stops.length - 1][0]).toBe(m.domain[1]);
    }
  });
});
