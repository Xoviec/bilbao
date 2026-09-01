import { describe, it, expect } from "vitest";
import { safetyFillColor, rampStops } from "../src/layers/safety";
import { METRICS, RAMP, DEFAULT_METRIC } from "../src/config";

describe("safetyFillColor", () => {
  it("obszary bez danych dostają kolor neutralny", () => {
    const expr = safetyFillColor() as unknown[];
    expect(expr[0]).toBe("case");
    expect((expr[1] as unknown[])[1]).toEqual(["get", "perception"]);
    expect(expr[2]).toBe("#cccccc"); // kolor braku danych
  });
});

describe("rampStops", () => {
  it("percepcja: wyżej = zieleń", () => {
    const stops = rampStops(METRICS.perception);
    expect(stops[0][1]).toBe(RAMP[0]);
    expect(stops[stops.length - 1][1]).toBe(RAMP[RAMP.length - 1]);
  });

  it("przestępczość: skala ODWRÓCONA, bo wyżej = gorzej", () => {
    // Dwie skale na jednej mapie: ten sam zielony nie może znaczyć dwóch rzeczy.
    const stops = rampStops(METRICS.crime_rate);
    expect(stops[0][1]).toBe(RAMP[RAMP.length - 1]);
    expect(stops[stops.length - 1][1]).toBe(RAMP[0]);
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
  it("obie metryki dotyczą BEZPIECZEŃSTWA i mają podany poziom pomiaru", () => {
    // Mapa bezpieczeństwa pokazuje wyłącznie bezpieczeństwo — dochód był błędem
    // (docs/METRIC_DECISION.md v2 → v3).
    expect(Object.keys(METRICS).sort()).toEqual(["crime_rate", "perception"]);
    expect(DEFAULT_METRIC).toBe("perception");
    expect(METRICS.perception.level).toBe("dzielnica");
    expect(METRICS.crime_rate.level).toBe("gmina");
    // Kierunki są przeciwne — legenda musi je rozróżniać.
    expect(METRICS.perception.higherIsBetter).toBe(true);
    expect(METRICS.crime_rate.higherIsBetter).toBe(false);
  });
});
