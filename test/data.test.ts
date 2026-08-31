import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CATEGORY_COLORS } from "../src/config";

const DATA = resolve(__dirname, "../public/data");
const read = (f: string) => JSON.parse(readFileSync(resolve(DATA, f), "utf8"));

const districts = read("districts.geojson");
const safety = read("safety.json");
const poi = read("poi.geojson");
const activities = read("activities.geojson");

const codes = new Set<string>(districts.features.map((f: any) => f.properties.code));
const safetyKeys = Object.keys(safety).filter((k) => !k.startsWith("_"));
const knownCategories = new Set(Object.keys(CATEGORY_COLORS));
const places = [...poi.features, ...activities.features];

describe("Integralność danych (public/data)", () => {
  it("każda dzielnica ma unikalny kod", () => {
    expect(codes.size).toBe(districts.features.length);
  });

  it("klucze safety.json = kody dzielnic (1:1)", () => {
    for (const k of safetyKeys) expect(codes.has(k), `safety ma nieznany kod: ${k}`).toBe(true);
    for (const c of codes) expect(safetyKeys.includes(c), `brak safety dla: ${c}`).toBe(true);
  });

  it("wskaźniki bezpieczeństwa są w zakresie 0–100 (lub null)", () => {
    for (const k of safetyKeys) {
      for (const field of ["safety_index", "day_score", "night_score"] as const) {
        const v = safety[k][field];
        if (v !== null && v !== undefined) {
          expect(v, `${k}.${field}`).toBeGreaterThanOrEqual(0);
          expect(v, `${k}.${field}`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("każde miejsce ma znaną kategorię", () => {
    for (const f of places) {
      expect(knownCategories.has(f.properties.category), `nieznana kategoria: ${f.properties.category}`).toBe(true);
    }
  });

  it("district każdego miejsca odnosi się do istniejącej dzielnicy", () => {
    for (const f of places) {
      const d = f.properties.district;
      if (d) expect(codes.has(d), `miejsce ${f.properties.name} → nieznana dzielnica ${d}`).toBe(true);
    }
  });

  it("geometrie punktów mają poprawne współrzędne [lng,lat]", () => {
    for (const f of places) {
      const [lng, lat] = f.geometry.coordinates;
      expect(lng).toBeGreaterThan(-3.2);
      expect(lng).toBeLessThan(-2.7);
      expect(lat).toBeGreaterThan(43.1);
      expect(lat).toBeLessThan(43.4);
    }
  });
});
