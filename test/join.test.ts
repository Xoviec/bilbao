import { describe, it, expect } from "vitest";
import { joinSafety } from "../src/data/join";
import type { SafetyMap, SafetyRecord } from "../src/data/loader";

const districts: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { code: "bilbao-abando", name: "Abando" }, geometry: { type: "Point", coordinates: [0, 0] } },
    { type: "Feature", properties: { code: "brak", name: "Brak" }, geometry: { type: "Point", coordinates: [1, 1] } },
  ],
};

const record: SafetyRecord = {
  perception: 5.44,
  perception_prev: 5.72,
  perception_trend: "down",
  perception_source: "ikerfel2025",
  perception_year: 2025,
  crime_rate: 16.3,
  crime_prev: 16.3,
  crime_trend: "flat",
  crime_change_pct: 0.5,
  crime_scope: "municipality",
  crime_source: "eustat2026q1",
  crime_period: "I kw. 2026",
  no_data_reason: null,
};

const safety: SafetyMap = { "bilbao-abando": record };

describe("joinSafety", () => {
  it("wstrzykuje obie metryki do pasującego obszaru", () => {
    const p = joinSafety(districts, safety).features[0].properties!;
    expect(p.perception).toBe(5.44);
    expect(p.perception_trend).toBe("down");
    expect(p.crime_rate).toBe(16.3);
    expect(p.crime_scope).toBe("municipality");
  });

  it("obszar bez danych dostaje null, nie zero", () => {
    // "0 przestępstw" i "nie wiemy" to dwie różne rzeczy — zero pokolorowałoby
    // obszar na zielono, sugerując pomiar, którego nie ma.
    const p = joinSafety(districts, safety).features[1].properties!;
    expect(p.perception).toBeNull();
    expect(p.crime_rate).toBeNull();
    expect(p.perception_trend).toBe("flat");
  });

  it("nie mutuje wejścia", () => {
    joinSafety(districts, safety);
    expect(districts.features[0].properties!.perception).toBeUndefined();
  });
});
