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
const registry = JSON.parse(
  readFileSync(resolve(__dirname, "../etl/cities.json"), "utf8"),
).cities as Array<{ slug: string; name: string; unit: string; minUnits: number }>;

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

  it("każda gmina z rejestru ma swoje jednostki", () => {
    for (const city of registry) {
      const units = districts.features.filter((f: any) => f.properties.city === city.slug);
      expect(units.length, `${city.name}: brak jednostek`).toBeGreaterThanOrEqual(city.minUnits);
      for (const u of units) {
        expect(u.properties.level, `${city.name}: zły poziom`).toBe(
          city.unit === "district" ? "district" : "municipality",
        );
      }
    }
  });

  it("kody są przestrzeniowane nazwą gminy", () => {
    // Bez prefiksu kody kolidują: Bilbao ma dzielnicę i barrio "Abando", a nazwy
    // typu "Centro" powtarzają się między gminami.
    for (const f of districts.features) {
      const { code, city, level } = f.properties;
      if (level === "municipality") expect(code).toBe(city);
      else expect(code.startsWith(`${city}-`), `kod bez prefiksu gminy: ${code}`).toBe(true);
    }
  });

  it("gminy bez realnych statystyk mają null, a nie zmyślone liczby", () => {
    // Wskaźników bezpieczeństwa nie ma w OSM. Dla gmin, dla których nikt ich nie
    // wprowadził, jedyną uczciwą wartością jest null (mapa rysuje je na szaro).
    const estimated = new Set(
      districts.features
        .filter((f: any) => f.properties.city === "bilbao")
        .map((f: any) => f.properties.code),
    );
    for (const k of safetyKeys) {
      if (estimated.has(k)) continue;
      expect(safety[k].safety_index, `${k} ma wymyślony wskaźnik`).toBeNull();
    }
  });

  it("granice dzielnic to realne poligony, nie prostokąty", () => {
    // Placeholdery miały po 5 punktów (4 rogi + domknięcie) i były zwykłym bboxem.
    // Realna granica administracyjna z OSM ma ich dziesiątki.
    for (const f of districts.features) {
      const ring = f.geometry.type === "Polygon"
        ? f.geometry.coordinates[0]
        : f.geometry.coordinates[0][0];
      expect(ring.length, `${f.properties.code} ma tylko ${ring.length} punktów`).toBeGreaterThan(20);
    }
  });

  it("szacunkowe dane bezpieczeństwa są jawnie oznaczone", () => {
    // Ostrzeżenie w UI zależy od tej flagi. Bez niej zmyślone wskaźniki
    // prezentowałyby się jak dane rzeczywiste.
    const anyEstimated = safetyKeys.some((k) => safety[k].safety_index !== null);
    if (anyEstimated) expect(safety._placeholder, "brak flagi _placeholder").toBe(true);
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
