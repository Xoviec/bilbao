#!/usr/bin/env node
/**
 * ETL: pobiera realne dane Bilbao z OpenStreetMap (Overpass API) i generuje
 * pliki do public/data/. Wymaga otwartego dostępu sieciowego do Overpass.
 *
 * Uruchomienie:  node etl/fetch-osm.mjs
 * Konfiguracja:  zmienne env OVERPASS_URL, DISTRICT_ADMIN_LEVEL (domyślnie 9).
 *
 * Uwaga: dane o BEZPIECZEŃSTWIE nie pochodzą z OSM — skrypt tworzy jedynie
 * szablon safety.template.json (kody dzielnic + null), do wypełnienia realnymi
 * statystykami wg docs/SAFETY_METHODOLOGY.md.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import osmtogeojson from "osmtogeojson";
import { overpass, slug, assignDistrict, bbox } from "./lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/data");
// Bez OVERPASS_URL przechodzimy po wbudowanej liście luster (patrz lib.mjs).
const ENDPOINT = process.env.OVERPASS_URL;
const ADMIN_LEVEL = process.env.DISTRICT_ADMIN_LEVEL || "9";

// Relacja OSM gminy Bilbao (Biskaja, Hiszpania). Przypięta po ID, NIE po nazwie:
// `["name"="Bilbao"]["admin_level"="8"]` dopasowuje na świecie trzy różne Bilbao
// (Hiszpania 339549, Ekwador 3728518, Kolumbia 4052108), przez co do danych trafiały
// POI z Ameryki Południowej — łapał to dopiero test zakresu współrzędnych.
const BILBAO_RELATION = process.env.BILBAO_RELATION_ID || "339549";
// Overpass adresuje obszary jako 3600000000 + id relacji.
const AREA = `area(${3600000000 + Number(BILBAO_RELATION)})->.b;`;

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

async function fetchDistricts() {
  const q = `[out:json][timeout:180];
    ${AREA}
    (relation(area.b)["boundary"="administrative"]["admin_level"="${ADMIN_LEVEL}"];);
    out geom;`;
  // Bilbao ma 8 dzielnic — pusta odpowiedź zawsze oznacza błąd lustra, nie brak danych.
  const geo = osmtogeojson(await overpass(q, ENDPOINT, { log: console.log, minElements: 8 }));
  const features = geo.features
    .filter((f) => f.geometry && /Polygon/.test(f.geometry.type))
    .map((f, i) => {
      const name = f.properties?.name || `Dzielnica ${i + 1}`;
      return {
        type: "Feature",
        id: i + 1,
        properties: { id: i + 1, name, code: slug(name) },
        geometry: f.geometry,
      };
    });
  if (!features.length) throw new Error(`Brak dzielnic dla admin_level=${ADMIN_LEVEL}. Spróbuj 10.`);
  return { type: "FeatureCollection", features };
}

async function fetchPlaces(districts) {
  const q = `[out:json][timeout:180];
    ${AREA}
    ( nwr(area.b)["tourism"];
      nwr(area.b)["historic"];
      nwr(area.b)["leisure"~"park|garden|nature_reserve|pitch|sports_centre|stadium|fitness_centre"];
      nwr(area.b)["amenity"~"theatre|arts_centre|cinema|bar|pub|nightclub|restaurant|cafe"];
    );
    out center tags;`;
  const raw = await overpass(q, ENDPOINT, { log: console.log, minElements: 100 });
  const dfeat = districts.features;
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
        id, name, category,
        district: assignDistrict([lng, lat], dfeat),
      },
      geometry: { type: "Point", coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))] },
    });
  }
  return features;
}

async function main() {
  console.log(`ETL: Overpass=${ENDPOINT || "lustra domyślne"}, admin_level=${ADMIN_LEVEL}`);

  console.log("→ Pobieram granice dzielnic…");
  const districts = await fetchDistricts();
  console.log(`  ${districts.features.length} dzielnic.`);

  console.log("→ Pobieram miejsca (POI + aktywności)…");
  const places = await fetchPlaces(districts);
  const poi = places.filter((f) => f.properties.category === "sight");
  const activities = places.filter((f) => f.properties.category !== "sight");
  console.log(`  ${poi.length} POI, ${activities.length} aktywności.`);

  // Szablon danych bezpieczeństwa (do wypełnienia realnymi statystykami).
  const safetyTemplate = {};
  for (const d of districts.features) {
    safetyTemplate[d.properties.code] = {
      safety_index: null, day_score: null, night_score: null,
      incidents_per_1k: null, trend: "flat", summary: "",
      _bbox: bbox(d.geometry).map((n) => Number(n.toFixed(5))),
    };
  }

  await writeFile(`${OUT}/districts.geojson`, JSON.stringify(districts));
  await writeFile(`${OUT}/poi.geojson`, JSON.stringify({ type: "FeatureCollection", features: poi }));
  await writeFile(`${OUT}/activities.geojson`, JSON.stringify({ type: "FeatureCollection", features: activities }));
  await writeFile(`${OUT}/safety.template.json`, JSON.stringify(safetyTemplate, null, 2));

  console.log("✓ Zapisano do public/data/. Uzupełnij safety.template.json → safety.json.");
}

main().catch((e) => {
  console.error("ETL błąd:", e.message);
  process.exit(1);
});
