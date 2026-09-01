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
const municipalities = read("municipalities.geojson");
const registry = JSON.parse(
  readFileSync(resolve(__dirname, "../etl/cities.json"), "utf8"),
).cities as Array<{ slug: string; name: string; unit: string; minUnits: number }>;

const codes = new Set<string>(districts.features.map((f: any) => f.properties.code));
const safetyUnits = safety._units as Record<string, any>;
const safetyKeys = Object.keys(safetyUnits);
const muniCrime = safety._municipalities as Record<string, any>;
const sourceData = JSON.parse(
  readFileSync(resolve(__dirname, "../etl/safety-data.json"), "utf8"),
);
const knownCategories = new Set(Object.keys(CATEGORY_COLORS));
const places = [...poi.features, ...activities.features];

describe("Integralność danych (public/data)", () => {
  it("każda dzielnica ma unikalny kod", () => {
    expect(codes.size).toBe(districts.features.length);
  });

  it("klucze safety.json = kody obszarów (1:1)", () => {
    for (const k of safetyKeys) expect(codes.has(k), `safety ma nieznany kod: ${k}`).toBe(true);
    for (const c of codes) expect(safetyKeys.includes(c), `brak safety dla: ${c}`).toBe(true);
  });

  it("wskaźniki mieszczą się w zakresie swojej skali (lub są null)", () => {
    for (const k of safetyKeys) {
      const p = safetyUnits[k].perception;
      if (p !== null) {
        expect(p, `${k}.perception`).toBeGreaterThanOrEqual(0);
        expect(p, `${k}.perception`).toBeLessThanOrEqual(10);
      }
      const c = safetyUnits[k].crime_rate;
      if (c !== null) {
        expect(c, `${k}.crime_rate`).toBeGreaterThanOrEqual(0);
        expect(c, `${k}.crime_rate`).toBeLessThan(200);
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

  it("każda liczba pochodzi z zadeklarowanego źródła", () => {
    // Sedno sprawy: wartość bez `*_source` to wartość znikąd. Ten test nie
    // pozwala jej wejść do repo.
    for (const k of safetyKeys) {
      const u = safetyUnits[k];
      if (u.perception !== null) {
        expect(u.perception_source, `${k}: percepcja bez źródła`).toBeTruthy();
        expect(safety._sources[u.perception_source], `${k}: nieznane źródło`).toBeTruthy();
      }
      if (u.crime_rate !== null) {
        expect(u.crime_source, `${k}: przestępczość bez źródła`).toBeTruthy();
        expect(safety._sources[u.crime_source], `${k}: nieznane źródło`).toBeTruthy();
      }
    }
  });

  it("wartości zgadzają się co do cyfry z plikiem źródłowym", () => {
    // safety.json jest generowane. Gdyby ktoś je podmienił ręcznie, rozjedzie
    // się z etl/safety-data.json — a tam każdy wpis ma cytowanie.
    for (const [code, v] of Object.entries(sourceData.perception)) {
      if (code.startsWith("_")) continue;
      expect(safetyUnits[code]?.perception, `${code}`).toBe((v as any).value);
    }
    for (const [city, v] of Object.entries(sourceData.crime.byMunicipality)) {
      const units = districts.features.filter((f: any) => f.properties.city === city);
      for (const u of units) {
        expect(safetyUnits[u.properties.code].crime_rate, u.properties.code).toBe((v as any).rate);
      }
    }
  });

  it("każda gmina z rejestru ma dane o przestępczości", () => {
    // Udalmap obejmuje wszystkie 251 gmin Kraju Basków, bez progu ludnościowego —
    // więc żaden obszar nie może zostać bez tej metryki.
    for (const city of registry) {
      const units = districts.features.filter((f: any) => f.properties.city === city.slug);
      for (const u of units) {
        expect(
          safetyUnits[u.properties.code].crime_rate,
          `${u.properties.code}: brak przestępczości`,
        ).not.toBeNull();
      }
    }
  });

  it("percepcja istnieje tylko tam, gdzie ją zbadano", () => {
    // Ratusz Bilbao bada percepcję u siebie. Poza Bilbao nikt tego nie robi,
    // więc jedyną uczciwą wartością jest null + podany powód.
    for (const f of districts.features) {
      const rec = safetyUnits[f.properties.code];
      if (f.properties.city === "bilbao") {
        expect(rec.perception, `${f.properties.code}: brak percepcji`).not.toBeNull();
      } else {
        expect(rec.perception, `${f.properties.code} ma wymyśloną percepcję`).toBeNull();
        expect(rec.no_data_reason, `${f.properties.code}: brak wyjaśnienia`).toBeTruthy();
      }
    }
  });

  it("zmiana procentowa zgadza się z dwiema liczbami ze źródła", () => {
    for (const f of districts.features) {
      const rec = safetyUnits[f.properties.code];
      if (rec.crime_rate == null) continue;
      const expected = ((rec.crime_rate - rec.crime_prev) / rec.crime_prev) * 100;
      expect(rec.crime_change_pct, f.properties.code).toBeCloseTo(expected, 1);
    }
  });

  it("wartość gminna przypisana dzielnicy jest oznaczona jako gminna", () => {
    // Bilbao ma jedną miejską stopę przestępczości i osiem dzielnic. Dziedziczenie
    // jest w porządku, ale UI musi móc powiedzieć, że to nie pomiar dzielnicy.
    for (const f of districts.features) {
      const rec = safetyUnits[f.properties.code];
      if (rec.crime_rate === null) continue;
      const expected = f.properties.level === "district" ? "municipality" : "unit";
      expect(rec.crime_scope, f.properties.code).toBe(expected);
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

  it("każde źródło ma komplet metadanych", () => {
    // Bez wydawcy, metody i URL-a czytelnik nie może zweryfikować liczby.
    for (const [id, s] of Object.entries(safety._sources as Record<string, any>)) {
      for (const field of ["title", "publisher", "method", "url", "scale"]) {
        expect(s[field], `źródło ${id}: brak pola ${field}`).toBeTruthy();
      }
      expect(String(s.url).startsWith("https://"), `źródło ${id}: URL nie jest https`).toBe(true);
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

describe("Warstwa gmin (choropleth przestępczości)", () => {
  it("jest jedna gmina na wpis w rejestrze", () => {
    expect(municipalities.features.length).toBe(registry.length);
    const codes = municipalities.features.map((f: any) => f.properties.code).sort();
    expect(codes).toEqual(registry.map((c) => c.slug).sort());
  });

  it("każda gmina ma stopę przestępczości", () => {
    // To jedyna warstwa niosąca ten choropleth — brak wartości = dziura w mapie.
    for (const f of municipalities.features) {
      expect(muniCrime[f.properties.code]?.crime_rate, f.properties.code).not.toBeNull();
    }
  });

  it("stopy gmin są różne — geometria niesie informację", () => {
    // Sedno przebudowy: wcześniej 8 dzielnic Bilbao dzieliło jedną wartość,
    // więc ich kształty udawały informację. Na warstwie gmin każda ma swoją.
    const rates = municipalities.features.map((f: any) => muniCrime[f.properties.code].crime_rate);
    expect(new Set(rates).size).toBe(rates.length);
  });

  it("gmina Bilbao pokrywa się z sumą swoich dzielnic", () => {
    // Bez tego choropleth gminy i granice dzielnic rozjechałyby się wizualnie.
    const bilbao = municipalities.features.find((f: any) => f.properties.code === "bilbao");
    expect(bilbao, "brak poligonu gminy Bilbao").toBeTruthy();
    const districtsOfBilbao = districts.features.filter((f: any) => f.properties.city === "bilbao");
    expect(districtsOfBilbao.length).toBe(8);
  });

  it("percepcja nie jest przypisana gminom", () => {
    // Badanie jest per dzielnica. Gmina nie ma własnej wartości i nie wolno jej
    // udawać, bo warstwa gmin nie rysuje percepcji.
    for (const f of municipalities.features) {
      expect(muniCrime[f.properties.code].perception).toBeUndefined();
    }
  });
});
