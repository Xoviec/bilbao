import { describe, it, expect } from "vitest";
import { joinSafety } from "../src/data/join";
import type { SafetyMap } from "../src/data/loader";

const districts: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { code: "abando", name: "Abando" }, geometry: { type: "Point", coordinates: [0, 0] } },
    { type: "Feature", properties: { code: "brak", name: "Brak" }, geometry: { type: "Point", coordinates: [1, 1] } },
  ],
};

const safety: SafetyMap = {
  abando: { safety_index: 86, day_score: 92, night_score: 78, incidents_per_1k: 9.4, trend: "up", summary: "x" },
};

describe("joinSafety", () => {
  it("wstrzykuje metryki do pasującej dzielnicy", () => {
    const out = joinSafety(districts, safety);
    const p = out.features[0].properties!;
    expect(p.safety_index).toBe(86);
    expect(p.day_score).toBe(92);
    expect(p.night_score).toBe(78);
    expect(p.trend).toBe("up");
  });

  it("ustawia null/flat dla dzielnicy bez danych", () => {
    const out = joinSafety(districts, safety);
    const p = out.features[1].properties!;
    expect(p.safety_index).toBeNull();
    expect(p.trend).toBe("flat");
  });

  it("nie mutuje wejścia", () => {
    joinSafety(districts, safety);
    expect(districts.features[0].properties!.safety_index).toBeUndefined();
  });
});
