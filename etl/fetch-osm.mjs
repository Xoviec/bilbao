#!/usr/bin/env node
/**
 * ETL: pobiera realne dane z OpenStreetMap (Overpass API) dla wszystkich gmin
 * z `etl/cities.json` i generuje pliki do public/data/.
 *
 * Uruchomienie:  node etl/fetch-osm.mjs [slug ...]   (bez argumentów = wszystkie)
 * Konfiguracja:  OVERPASS_URL, DISTRICT_ADMIN_LEVEL (domyślnie 9).
 *
 * JEDNOSTKA choroplethu zależy od gminy (pole `unit` w rejestrze):
 *   - "district"     — podział na dzielnice (admin_level=9). W całej prowincji
 *                      Bizkaia ma go WYŁĄCZNIE Bilbao.
 *   - "municipality" — brak podziału w OSM, więc jednostką jest cała gmina.
 * Dzięki temu mapa jest w dwóch rozdzielczościach i musi to jawnie komunikować —
 * stąd `properties.level` na każdym featerze.
 *
 * Uwaga: dane o BEZPIECZEŃSTWIE nie pochodzą z OSM — skrypt tworzy jedynie
 * szablon safety.template.json (kody + null), do wypełnienia realnymi
 * statystykami wg docs/SAFETY_METHODOLOGY.md.
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import osmtogeojson from "osmtogeojson";
import { overpass, slug, assignDistrict, bbox } from "./lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/data");
// Bez OVERPASS_URL przechodzimy po wbudowanej liście luster (patrz lib.mjs).
const ENDPOINT = process.env.OVERPASS_URL;
const ADMIN_LEVEL = process.env.DISTRICT_ADMIN_LEVEL || "9";
// Przerwa między gminami — bez niej sami wywołujemy dławienie (429) na lustrach.
const PAUSE_MS = 3000;

// Overpass adresuje obszary jako 3600000000 + id relacji.
const areaOf = (relation) => `area(${3600000000 + Number(relation)})->.a;`;

// Mapowanie tagów OSM → kategorie aplikacji.
const CATEGORY_RULES = [
  { key: "tourism", values: ["attraction", "museum", "viewpoint", "artwork", "gallery"], category: "sight" },
  { key: "historic", values: ["*"], category: "sight" },
  { key: "leisure", values: ["park", "garden", "nature_reserve"], category: "green" },
  { key: "leisure", values: ["pitch", "sports_centre", "stadium", "fitness_centre"], category: "sport" },
  { key: "amenity", values: ["theatre", "arts_centre", "cinema"], category: "culture" },
  { key: "amenity", values: ["bar", "pub", "nightclub"], category: "nightlife" },
  { key: "amenity", values: ["restaurant", "cafe"], category: "food" },
];

function categoryFor(tags = {}) {
  for (const rule of CATEGORY_RULES) {
    const v = tags[rule.key];
    if (v && (rule.values.includes("*") || rule.values.includes(v))) return rule.category;
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cache per gmina. Publiczne lustra Overpass sypią się losowo (429/502/504), a bez
// cache'u upadek na dziewiątej gminie kasuje pobranie ośmiu poprzednich i każde
// ponowienie zaczyna od zera — czyli dokłada ruchu, przez który sypią się dalej.
// Ponowny przebieg dociąga tylko to, czego brakuje. `npm run etl -- --refresh`
// wymusza pobranie od nowa.
const CACHE = resolve(__dirname, ".cache");
const REFRESH = process.argv.includes("--refresh");

async function cached(key, produce) {
  const file = resolve(CACHE, `${key}.json`);
  if (!REFRESH && existsSync(file)) {
    console.log(`  (cache) ${key}`);
    return JSON.parse(await readFile(file, "utf8"));
  }
  const value = await produce();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, JSON.stringify(value));
  return value;
}

/** Poligon całej gminy (relacja OSM). */
async function fetchMunicipality(city) {
  const q = `[out:json][timeout:180];relation(${city.relation});out geom;`;
  const geo = osmtogeojson(await overpass(q, ENDPOINT, { log: console.log, minElements: 1 }));
  const poly = geo.features.find((f) => /Polygon/.test(f.geometry?.type || ""));
  if (!poly) throw new Error(`${city.name}: relacja ${city.relation} nie dała poligonu`);
  return {
    type: "Feature",
    properties: { code: city.slug, name: city.name, city: city.slug, level: "municipality" },
    geometry: poly.geometry,
  };
}

/**
 * Jednostki choroplethu dla jednej gminy.
 * Kod jest przestrzeniowany nazwą gminy (`bilbao-abando`, `barakaldo`), bo same
 * slugi nazw kolidują — Bilbao ma dzielnicę i barrio "Abando", a nazwy typu
 * "Centro" powtarzają się między gminami.
 */
async function fetchUnits(city, municipality) {
  if (city.unit === "municipality") {
    // Gmina bez podziału JEST swoją jednostką — nie pobieramy jej drugi raz.
    return [{
      ...municipality,
      properties: { ...municipality.properties, cityName: city.name },
    }];
  }

  const q = `[out:json][timeout:180];
    ${areaOf(city.relation)}
    (relation(area.a)["boundary"="administrative"]["admin_level"="${ADMIN_LEVEL}"];);
    out geom;`;
  const geo = osmtogeojson(
    await overpass(q, ENDPOINT, { log: console.log, minElements: city.minUnits }),
  );
  const feats = geo.features
    .filter((f) => f.geometry && /Polygon/.test(f.geometry.type))
    .map((f) => {
      const name = f.properties?.name || "?";
      return {
        type: "Feature",
        properties: {
          code: `${city.slug}-${slug(name)}`,
          name,
          city: city.slug,
          cityName: city.name,
          level: "district",
        },
        geometry: f.geometry,
      };
    });
  if (feats.length < city.minUnits) {
    throw new Error(`${city.name}: ${feats.length} jednostek, oczekiwano ≥${city.minUnits}`);
  }
  return feats;
}

/** POI + aktywności w granicach jednej gminy, przypisane do jej jednostek. */
async function fetchPlaces(city, units) {
  const q = `[out:json][timeout:180];
    ${areaOf(city.relation)}
    ( nwr(area.a)["tourism"];
      nwr(area.a)["historic"];
      nwr(area.a)["leisure"~"park|garden|nature_reserve|pitch|sports_centre|stadium|fitness_centre"];
      nwr(area.a)["amenity"~"theatre|arts_centre|cinema|bar|pub|nightclub|restaurant|cafe"];
    );
    out center tags;`;
  const raw = await overpass(q, ENDPOINT, { log: console.log, minElements: city.minPlaces });
  const seen = new Set();
  const features = [];
  for (const el of raw.elements) {
    const tags = el.tags || {};
    const category = categoryFor(tags);
    const name = tags.name;
    if (!category || !name) continue;
    const lng = el.lon ?? el.center?.lon;
    const lat = el.lat ?? el.center?.lat;
    if (lng == null || lat == null) continue;
    const id = `${el.type[0]}-${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    features.push({
      type: "Feature",
      properties: {
        id,
        name,
        category,
        city: city.slug,
        // Dla gmin bez podziału to po prostu kod gminy — punkt i tak leży w jej
        // jedynej jednostce, więc join po `district` działa tak samo jak w Bilbao.
        district: assignDistrict([lng, lat], units),
      },
      geometry: { type: "Point", coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))] },
    });
  }
  return features;
}

async function main() {
  const registry = JSON.parse(await readFile(resolve(__dirname, "cities.json"), "utf8"));
  const only = process.argv.slice(2);
  const cities = only.length
    ? registry.cities.filter((c) => only.includes(c.slug))
    : registry.cities;
  if (!cities.length) throw new Error(`Brak gmin do pobrania (podano: ${only.join(", ")})`);

  console.log(`ETL: Overpass=${ENDPOINT || "lustra domyślne"}, gmin=${cities.length}\n`);

  const allUnits = [];
  const allPlaces = [];
  const allMunicipalities = [];
  const manifest = [];

  for (const city of cities) {
    console.log(`→ ${city.name} (${city.unit})`);
    const municipality = await cached(`${city.slug}-muni`, async () => {
      const m = await fetchMunicipality(city);
      await sleep(PAUSE_MS);
      return m;
    });
    const units = await cached(`${city.slug}-units`, async () => {
      const u = await fetchUnits(city, municipality);
      await sleep(PAUSE_MS);
      return u;
    });
    console.log(`  jednostek: ${units.length}`);

    const places = await cached(`${city.slug}-places`, async () => {
      const p = await fetchPlaces(city, units);
      await sleep(PAUSE_MS);
      return p;
    });
    console.log(`  miejsc: ${places.length}`);

    allUnits.push(...units);
    allPlaces.push(...places);
    allMunicipalities.push(municipality);
    manifest.push({
      slug: city.slug,
      name: city.name,
      unit: city.unit,
      units: units.length,
      places: places.length,
      bbox: units
        .map((u) => bbox(u.geometry))
        .reduce((a, b) => [
          Math.min(a[0], b[0]), Math.min(a[1], b[1]),
          Math.max(a[2], b[2]), Math.max(a[3], b[3]),
        ])
        .map((n) => Number(n.toFixed(5))),
    });
  }

  // districts.geojson trzyma WYŁĄCZNIE realne dzielnice. Jednostki gminne to ta
  // sama geometria co municipalities.geojson — trzymanie jej dwa razy dokładało
  // 63 KB (64% pliku), a warstwy dzielnic i tak filtrują je przez level=district.
  const districts = {
    type: "FeatureCollection",
    features: allUnits.filter((f) => f.properties.level === "district"),
  };
  const poi = allPlaces.filter((f) => f.properties.category === "sight");
  const activities = allPlaces.filter((f) => f.properties.category !== "sight");

  // Szablon danych bezpieczeństwa (do wypełnienia realnymi statystykami).
  const safetyTemplate = {};
  for (const u of allUnits) {
    safetyTemplate[u.properties.code] = {
      safety_index: null, day_score: null, night_score: null,
      incidents_per_1k: null, trend: "flat", summary: "",
      _bbox: bbox(u.geometry).map((n) => Number(n.toFixed(5))),
    };
  }

  // Osobna warstwa gmin. Przestępczość jest mierzona NA POZIOMIE GMINY, więc
  // choropleth musi być rysowany na gminach — inaczej osiem dzielnic Bilbao
  // dostaje jedną i tę samą wartość i geometria dzielnic udaje informację.
  await writeFile(
    `${OUT}/municipalities.geojson`,
    JSON.stringify({ type: "FeatureCollection", features: allMunicipalities }),
  );
  await writeFile(`${OUT}/districts.geojson`, JSON.stringify(districts));
  await writeFile(`${OUT}/poi.geojson`, JSON.stringify({ type: "FeatureCollection", features: poi }));
  await writeFile(`${OUT}/activities.geojson`, JSON.stringify({ type: "FeatureCollection", features: activities }));
  await writeFile(`${OUT}/cities.json`, JSON.stringify(manifest, null, 2));
  await writeFile(`${OUT}/safety.template.json`, JSON.stringify(safetyTemplate, null, 2));

  console.log(
    `\n✓ ${allMunicipalities.length} gmin, ${districts.features.length} dzielnic, ` +
      `${poi.length} POI, ${activities.length} aktywności.`,
  );
  console.log("  Zapisano do public/data/. Uzupełnij safety.template.json → safety.json.");
}

main().catch((e) => {
  console.error("ETL błąd:", e.message);
  process.exit(1);
});
