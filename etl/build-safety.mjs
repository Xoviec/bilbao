#!/usr/bin/env node
/**
 * Buduje public/data/safety.json z etl/safety-data.json (dane + cytowania)
 * i public/data/districts.geojson (lista jednostek).
 *
 * Uruchomienie:  node etl/build-safety.mjs   (albo: npm run safety)
 *
 * ZASADA: żadna liczba nie powstaje tutaj. Skrypt tylko przepisuje to, co ktoś
 * wpisał do safety-data.json wraz ze źródłem, i wstawia `null` wszędzie tam,
 * gdzie źródła nie ma. Nie interpoluje, nie uśrednia i nie zgaduje.
 *
 * Dwie metryki celowo NIE są łączone w jeden indeks:
 *   - `perception`  — subiektywna ocena mieszkańców (0–10), badanie ankietowe,
 *   - `crime_rate`  — przestępstwa na 1000 mieszkańców, dane policyjne.
 * Mierzą różne rzeczy, mają różne źródła i różny zasięg. Zważenie ich w jedną
 * liczbę wyglądałoby precyzyjnie, a byłoby wymysłem.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, "../public/data");

const trendOf = (now, prev) => {
  if (now == null || prev == null) return "flat";
  const d = now - prev;
  if (Math.abs(d) < 0.005) return "flat";
  return d > 0 ? "up" : "down";
};

const main = async () => {
  const src = JSON.parse(await readFile(resolve(__dirname, "safety-data.json"), "utf8"));
  const districts = JSON.parse(await readFile(`${DATA}/districts.geojson`, "utf8"));
  const municipalities = JSON.parse(await readFile(`${DATA}/municipalities.geojson`, "utf8"));

  const out = {
    _README:
      "GENEROWANE przez etl/build-safety.mjs — nie edytuj ręcznie. " +
      "Dane i źródła: etl/safety-data.json.",
    _sources: src.sources,
    _cityWide: src.cityWide,
    _reference: src.crime._reference,
    // Przestępczość jest mierzona NA POZIOMIE GMINY i tak też jest rysowana.
    // Dzielnice dostają ją tylko do panelu (z adnotacją `crime_scope`).
    _municipalities: {},
    _units: {},
  };

  for (const f of municipalities.features) {
    const city = f.properties.code;
    const c = src.crime.byMunicipality[city];
    out._municipalities[city] = {
      name: f.properties.name,
      crime_rate: c ? c.rate : null,
      crime_prev: c ? c.prev : null,
      crime_trend: c ? trendOf(c.rate, c.prev) : "flat",
      crime_change_pct: c ? Number((((c.rate - c.prev) / c.prev) * 100).toFixed(1)) : null,
      crime_source: c ? src.crime._source : null,
      crime_period: c ? src.crime._period : null,
    };
  }

  const stats = { perception: 0, crime: 0, empty: 0 };

  // Obszary wybieralne w UI: dzielnice + te gminy, które nie mają podziału.
  // districts.geojson trzyma już tylko realne dzielnice, więc gminy bez podziału
  // dokładamy z warstwy gmin — inaczej wypadłyby z safety.json.
  const districtCities = new Set(districts.features.map((f) => f.properties.city));
  const areas = [
    ...districts.features,
    ...municipalities.features.filter((f) => !districtCities.has(f.properties.code)),
  ];

  for (const f of areas) {
    const { code, city, level } = f.properties;

    const p = src.perception[code];
    const c = src.crime.byMunicipality[city];

    // Percepcja jest mierzona per dzielnica; gminy bez badania mają null.
    const perception = p ? p.value : null;
    // Przestępczość jest mierzona WYŁĄCZNIE per gmina. Dzielnica NIE dostaje jej
    // jako własnej wartości — wpisanie ośmiu dzielnicom Bilbao tej samej liczby
    // wyglądało jak zepsute dane, mimo dopisku o zasięgu. Wartość gminy trafia do
    // osobnego pola `city_crime_*`, które UI pokazuje jako kontekst, nie jako
    // metrykę tego obszaru.
    // (Raport "Bilbao Hiri Segurua" UPV/EHU z 2026 dopiero REKOMENDUJE miastu
    //  publikowanie biuletynów bezpieczeństwa w podziale na dzielnice — takich
    //  danych po prostu jeszcze nie ma.)
    const isDistrict = level === "district";
    const crime = isDistrict ? null : c ? c.rate : null;

    if (perception != null) stats.perception++;
    if (crime != null) stats.crime++;
    if (perception == null && crime == null) stats.empty++;

    out._units[code] = {
      perception,
      perception_prev: p ? p.prev : null,
      perception_trend: p ? trendOf(p.value, p.prev) : "flat",
      perception_source: perception != null ? src.perception._source : null,
      perception_year: perception != null ? src.perception._year : null,

      crime_rate: crime,
      crime_prev: crime != null ? c.prev : null,
      // Dla przestępczości "up" znaczy WIĘCEJ przestępstw, czyli gorzej.
      crime_trend: crime != null ? trendOf(c.rate, c.prev) : "flat",
      // Liczone tutaj, nie przepisywane — dwie liczby ze źródła są jedyną prawdą.
      crime_change_pct:
        crime != null ? Number((((c.rate - c.prev) / c.prev) * 100).toFixed(1)) : null,
      crime_source: crime != null ? src.crime._source : null,
      crime_period: crime != null ? src.crime._period : null,

      // Kontekst, nie metryka tego obszaru: stopa CAŁEJ gminy, w której leży
      // dzielnica. Wypełniane tylko dla dzielnic — gmina ma to w `crime_rate`.
      city_name: isDistrict && c ? f.properties.cityName ?? city : null,
      city_crime_rate: isDistrict && c ? c.rate : null,
      city_crime_period: isDistrict && c ? src.crime._period : null,

      // Percepcję bada tylko Ratusz Bilbao i tylko u siebie.
      no_data_reason:
        perception == null
          ? "Percepcji bezpieczeństwa nie bada się poza Bilbao."
          : null,
    };
  }

  await writeFile(`${DATA}/safety.json`, JSON.stringify(out, null, 2));

  console.log(`✓ safety.json: ${areas.length} obszarów`);
  console.log(`  percepcja (per dzielnica): ${stats.perception}`);
  console.log(`  gmin z przestępczością:    ${Object.values(out._municipalities).filter((m) => m.crime_rate != null).length}/${municipalities.features.length}`);
  console.log(`  bez żadnych danych:        ${stats.empty}`);
};

main().catch((e) => {
  console.error("build-safety błąd:", e.message);
  process.exit(1);
});
