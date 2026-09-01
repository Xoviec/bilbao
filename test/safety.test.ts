import { describe, it, expect } from "vitest";
import { safetyFillColor, rampStops } from "../src/layers/safety";
import { METRICS, RAMP, DEFAULT_METRIC } from "../src/config";

describe("safetyFillColor", () => {
  it("obszary bez danych dostają kolor neutralny", () => {
    const expr = safetyFillColor() as unknown[];
    expect(expr[0]).toBe("case");
    expect((expr[1] as unknown[])[1]).toEqual(["get", "crime_rate"]);
    expect(expr[2]).toBe("#cccccc"); // kolor braku danych
  });
});

describe("rampStops", () => {
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

describe("konfiguracja metryk", () => {
  it("jest DOKŁADNIE jedna metryka", () => {
    // Sedno decyzji z docs/METRIC_DECISION.md: jeden wskaźnik na jednej
    // jednostce. Druga metryka na innym poziomie pomiaru zawsze prowadziła do
    // szarych plam albo do tej samej liczby powtórzonej na wielu kształtach.
    expect(Object.keys(METRICS)).toEqual(["crime_rate"]);
    expect(DEFAULT_METRIC).toBe("crime_rate");
  });
});
