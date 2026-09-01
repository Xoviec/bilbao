#!/usr/bin/env node
/**
 * ETL: dystrykty INE + dochód na osobę (Atlas de Distribución de Renta de los
 * Hogares) dla gmin z `etl/cities.json`.
 *
 * Uruchomienie:  node etl/fetch-ine.mjs [--refresh]
 *
 * DLACZEGO INE, a nie OSM: podziału administracyjnego poniżej gminy nie ma
 * w OSM dla nikogo poza Bilbao. INE dzieli KAŻDĄ hiszpańską gminę na dystrykty,
 * więc to jedyna jednostka, w której Bilbao i wszyscy sąsiedzi mają ten sam
 * podział i ten sam wskaźnik. Patrz docs/METRIC_DECISION.md.
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/data");
const CACHE = resolve(__dirname, ".cache");
const REFRESH = process.argv.includes("--refresh");
const UA = { "User-Agent": "bilbao-safety-map/0.1 (+https://github.com/Xoviec/bilbao)" };

// Warstwa granic INE (zawiera dystrykty i sekcje censalne całej Hiszpanii).
const GEO =
  "https://www.ine.es/geoserver/ogc/features/v1/collections/" +
  "WMS_INE_SECCIONES_G01:Secciones_2025/items";
// Tabela ADRH dla Bizkai. Zawiera serie municipio / distrito / sección.
const ADRH = "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/30917?nult=2";

const cached = async (key, produce) => {
  const file = resolve(CACHE, `${key}.json`);
  if (!REFRESH && existsSync(file)) {
    console.log(`  (cache) ${key}`);
    return JSON.parse(await readFile(file, "utf8"));
  }
  const value = await produce();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, JSON.stringify(value));
  return value;
};

const getJSON = async (url) => {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url.slice(0, 80)}`);
  return res.json();
};

async function main() {
  const registry = JSON.parse(await readFile(resolve(__dirname, "cities.json"), "utf8"));
  const cities = registry.cities;
  const byIne = new Map(cities.map((c) => [c.ine, c]));

  // --- 1. Granice dystryktów -------------------------------------------------
  const filter = `CUMUN IN (${cities.map((c) => `'${c.ine}'`).join(",")})`;
  const url =
    `${GEO}?f=application%2Fgeo%2Bjson&limit=2000&filter-lang=cql2-text` +
    `&filter=${encodeURIComponent(filter)}`;
  console.log("→ Granice dystryktów INE…");
  const geo = await cached("ine-districts", () => getJSON(url));
  const districts = geo.features.filter((f) => f.properties.TIPO === "DISTRITO");
  console.log(`  ${districts.length} dystryktów`);

  // --- 2. Dochód na osobę ----------------------------------------------------
  console.log("→ Dochód na osobę (ADRH)…");
  const adrh = await cached("ine-adrh", () => getJSON(ADRH));
  const income = new Map();
  const RE = /^(.+?) distrito (\d+)\. Dato base\. Renta neta media por persona\./;
  for (const s of adrh) {
    const m = RE.exec(s.Nombre);
    if (!m) continue;
    const city = cities.find((c) => c.name === m[1].trim());
    if (!city) continue;
    const years = Object.fromEntries(s.Data.map((d) => [d.Anyo, d.Valor]));
    income.set(`${city.ine}${m[2]}`, years);
  }
  console.log(`  ${income.size} serii dochodowych`);

  // --- 3. Złożenie -----------------------------------------------------------
  const years = [...new Set([...income.values()].flatMap((v) => Object.keys(v)))]
    .map(Number)
    .sort();
  const latest = years[years.length - 1];
  const prev = years[years.length - 2];

  const features = districts.map((f) => {
    const p = f.properties;
    const city = byIne.get(p.CUMUN);
    const key = p.CUDIS; // np. 4802006
    const v = income.get(key) ?? {};
    // Dzielnice Bilbao mają nazwy własne; u sąsiadów INE ich nie nadaje.
    const name = city.districtNames?.[p.CDIS] ?? `${city.name} · dystrykt ${Number(p.CDIS)}`;
    return {
      type: "Feature",
      properties: {
        code: `ine-${key}`,
        name,
        city: city.slug,
        cityName: city.name,
        district: Number(p.CDIS),
        income: v[latest] ?? null,
        income_prev: v[prev] ?? null,
        income_year: latest,
      },
      geometry: f.geometry,
    };
  });

  const missing = features.filter((f) => f.properties.income == null);
  if (missing.length) {
    throw new Error(
      `Brak dochodu dla ${missing.length} dystryktów: ` +
        missing.map((f) => f.properties.code).join(", "),
    );
  }

  await writeFile(
    `${OUT}/ine-districts.geojson`,
    JSON.stringify({ type: "FeatureCollection", features }),
  );

  const vals = features.map((f) => f.properties.income);
  console.log(`\n✓ ${features.length} dystryktów, dochód ${latest} (poprz. ${prev})`);
  console.log(`  zakres: ${Math.min(...vals)} – ${Math.max(...vals)} EUR`);
  console.log(`  różnych wartości: ${new Set(vals).size}/${vals.length}`);
}

main().catch((e) => {
  console.error("fetch-ine błąd:", e.message);
  process.exit(1);
});
