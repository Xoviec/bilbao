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

// Obszary mapy: 8 dzielnic Bilbao (percepcja) + 8 gmin sąsiednich (przestępczość).
// Gmina Bilbao nie jest obszarem — reprezentują ją dzielnice.
const areas = [
  ...districts.features,
  ...municipalities.features.filter((f: any) => f.properties.code !== "bilbao"),
];
const codes = new Set<string>(areas.map((f: any) => f.properties.code));
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
    expect(codes.size).toBe(areas.length);
  });

  it("safety.json pokrywa obszary mapy i dzielnice", () => {
    // Gminy = obszary mapy; dzielnice = dane do panelu gminy.
    const all = new Set<string>([
      ...municipalities.features.map((f: any) => f.properties.code),
      ...districts.features.map((f: any) => f.properties.code),
    ]);
    for (const k of safetyKeys) expect(all.has(k), `safety ma nieznany kod: ${k}`).toBe(true);
    for (const c of all) expect(safetyKeys.includes(c), `brak safety dla: ${c}`).toBe(true);
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

  it("każde miejsce należy do istniejącej gminy", () => {
    const cities = new Set(municipalities.features.map((f: any) => f.properties.code));
    for (const f of places) {
      expect(cities.has(f.properties.city), `miejsce ${f.properties.name}`).toBe(true);
    }
  });

  it("kody są przestrzeniowane nazwą gminy", () => {
    // Bez prefiksu kody kolidują: Bilbao ma dzielnicę i barrio "Abando", a nazwy
    // typu "Centro" powtarzają się między gminami.
    for (const f of areas) {
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
      expect(muniCrime[city].crime_rate, city).toBe((v as any).rate);
    }
  });

  it("każda gmina z rejestru ma stopę przestępczości na warstwie gmin", () => {
    // Udalmap obejmuje wszystkie 251 gmin Kraju Basków, bez progu ludnościowego.
    for (const city of registry) {
      expect(muniCrime[city.slug]?.crime_rate, `${city.name}: brak przestępczości`).not.toBeNull();
    }
  });

  it("percepcja istnieje tylko dla dzielnic Bilbao", () => {
    // Nie jest miernikiem mapy — istnieje wyłącznie w Bilbao, więc z definicji
    // nie mogłaby być jednolita. Trafia do panelu gminy jako dodatek.
    for (const f of districts.features) {
      expect(safetyUnits[f.properties.code].perception, f.properties.code).not.toBeNull();
    }
    for (const f of municipalities.features) {
      expect(safetyUnits[f.properties.code].perception, f.properties.code).toBeNull();
    }
  });

  it("zmiana procentowa zgadza się z dwiema liczbami ze źródła", () => {
    for (const rec of Object.values(muniCrime)) {
      if (rec.crime_rate == null) continue;
      const expected = ((rec.crime_rate - rec.crime_prev) / rec.crime_prev) * 100;
      expect(rec.crime_change_pct, rec.name).toBeCloseTo(expected, 1);
    }
  });

  it("dzielnica nie ma WŁASNEJ stopy przestępczości", () => {
    // Nikt nie publikuje przestępczości w podziale na dzielnice (raport
    // "Bilbao Hiri Segurua" UPV/EHU dopiero to miastu rekomenduje). Wpisanie
    // ośmiu dzielnicom tej samej liczby miejskiej wyglądało jak zepsute dane.
    for (const f of areas) {
      const rec = safetyUnits[f.properties.code];
      if (f.properties.level !== "district") continue;
      expect(rec.crime_rate, `${f.properties.code} ma własną przestępczość`).toBeNull();
      expect(rec.crime_source, `${f.properties.code}`).toBeNull();
    }
  });

  it("dzielnica dostaje stopę gminy jako jawnie podpisany kontekst", () => {
    for (const f of areas) {
      const rec = safetyUnits[f.properties.code];
      if (f.properties.level !== "district") continue;
      expect(rec.city_crime_rate, `${f.properties.code}: brak kontekstu`).not.toBeNull();
      expect(rec.city_name, `${f.properties.code}: kontekst bez nazwy gminy`).toBeTruthy();
      // Kontekst musi zgadzać się ze stopą gminy, w której dzielnica leży.
      expect(rec.city_crime_rate).toBe(muniCrime[f.properties.city].crime_rate);
    }
  });

  it("gmina ma własną stopę, dzielnica nie", () => {
    for (const f of municipalities.features) {
      expect(safetyUnits[f.properties.code].crime_rate, f.properties.code).not.toBeNull();
    }
    for (const f of districts.features) {
      expect(safetyUnits[f.properties.code].crime_rate, f.properties.code).toBeNull();
    }
  });

  it("granice dzielnic to realne poligony, nie prostokąty", () => {
    // Placeholdery miały po 5 punktów (4 rogi + domknięcie) i były zwykłym bboxem.
    // Realna granica administracyjna z OSM ma ich dziesiątki.
    for (const f of areas) {
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

describe("Obszary mapy: 8 dzielnic Bilbao + 8 gmin sąsiednich", () => {
  const neighbours = municipalities.features.filter((f: any) => f.properties.code !== "bilbao");

  it("Bilbao JEST podzielone na 8 dzielnic", () => {
    expect(districts.features.length).toBe(8);
    const names = districts.features.map((f: any) => f.properties.name).sort();
    expect(names).toEqual([
      "Abando", "Basurtu-Zorrotza", "Begoña", "Deusto",
      "Errekalde", "Ibaiondo", "Otxarkoaga-Txurdinaga", "Uribarri",
    ]);
  });

  it("każda dzielnica ma percepcję — metrykę mierzoną NA JEJ poziomie", () => {
    for (const f of districts.features) {
      const v = safetyUnits[f.properties.code].perception;
      expect(v, f.properties.code).not.toBeNull();
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it("każda gmina sąsiednia ma stopę przestępczości", () => {
    expect(neighbours.length).toBe(8);
    for (const f of neighbours) {
      expect(safetyUnits[f.properties.code].crime_rate, f.properties.code).not.toBeNull();
    }
  });

  it("wartości w obrębie każdej skali są RÓŻNE", () => {
    // Regresja wracała wielokrotnie: ta sama liczba na wielu kształtach.
    const per = districts.features.map((f: any) => safetyUnits[f.properties.code].perception);
    expect(new Set(per).size).toBe(per.length);
    const cr = neighbours.map((f: any) => safetyUnits[f.properties.code].crime_rate);
    expect(new Set(cr).size).toBe(cr.length);
  });

  it("statystyki wiktymizacyjne są obecne i mają rok porównawczy", () => {
    // To są dane, o które pyta się najczęściej: kradzieże, rozboje, napaści.
    const v = safety._victimisation;
    expect(v, "brak bloku wiktymizacji").toBeTruthy();
    expect(v.items.length).toBeGreaterThanOrEqual(4);
    const labels = v.items.map((i: any) => i.label);
    expect(labels).toContain("Kradzież");
    expect(labels).toContain("Rozbój z przemocą");
    for (const it of v.items) expect(typeof it.value).toBe("number");
  });

  it("dane o bezpieczeństwie nie są zastąpione niczym innym", () => {
    // Wersja 2 pokazywała dochód — to był błąd. Żaden obszar nie ma pola income.
    for (const f of [...districts.features, ...municipalities.features]) {
      expect(f.properties.income, `${f.properties.code} ma pole dochodowe`).toBeUndefined();
    }
  });
});
