import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

import { createMap, resolveStyle } from "./map";
import { loadAllData } from "./data/loader";
import { bounds, collectionBounds, padBounds } from "./data/geo";
import { addDistrictLayers, setSafetyField } from "./layers/districts";
import { addPlacesLayer } from "./layers/places";
import { renderLegend } from "./ui/legend";
import { showDistrict, type PlaceItem } from "./ui/sidebar";
import { renderFilters, type FilterItem } from "./ui/filters";
import { renderControls } from "./ui/controls";
import { openMethodology } from "./ui/methodology";
import { CATEGORY_COLORS, CATEGORY_LABELS, VIEW, DEFAULT_METRIC, type MetricId } from "./config";

const el = (id: string) => document.getElementById(id) as HTMLElement;

async function bootstrap(): Promise<void> {
  // Sondowanie dostawcy kafli i pobieranie danych biegną równolegle — oba są
  // sieciowe i niezależne, więc szeregowanie ich podwajałoby czas startu.
  const [style, data] = await Promise.all([resolveStyle(), loadAllData()]);

  // Kadr wynika z danych, nie ze stałej: zbiór gmin bywa różny (patrz
  // etl/cities.json), a zaszyty bbox Bilbao ucinałby sąsiadów.
  // Zakres z warstwy GMIN — districts.geojson trzyma już tylko dzielnice Bilbao,
  // więc sam by kadrował mapę na jedno miasto.
  const dataBounds = collectionBounds(data.municipalities);
  const map = createMap("map", style, {
    bounds: dataBounds,
    maxBounds: padBounds(dataBounds, VIEW.boundsPadding),
  });

  // Obszary wybieralne: dzielnice + gminy bez podziału. Gmina Bilbao jest
  // reprezentowana przez swoje dzielnice, więc nie dublujemy jej na liście.
  const districtCities = new Set(data.districts.features.map((f) => f.properties?.city));
  const areas = [
    ...data.districts.features,
    ...data.municipalities.features.filter((f) => !districtCities.has(f.properties?.code)),
  ];

  const districtByCode = new Map(
    [...areas, ...data.municipalities.features].map((f) => [f.properties?.code as string, f]),
  );
  // Etykieta jednostki. Dzielnicę poprzedzamy nazwą gminy, bo lista miesza dwa
  // poziomy (dzielnice Bilbao + całe gminy) i samo "Abando" nie mówi, gdzie to jest.
  const labelOf = (f: GeoJSON.Feature): string => {
    const name = f.properties?.name as string;
    const cityName = f.properties?.cityName as string | undefined;
    return f.properties?.level === "district" && cityName ? `${cityName} — ${name}` : name;
  };

  // Nazwy i geometria także dla gmin spoza listy wyboru (Bilbao), bo w trybie
  // przestępczości można w nie kliknąć na mapie.
  const nameByCode = new Map(
    [...areas, ...data.municipalities.features].map((f) => [
      f.properties?.code as string,
      labelOf(f),
    ]),
  );

  // Wspólne źródło miejsc: POI + aktywności.
  const places: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [...data.poi.features, ...data.activities.features],
  };

  // Miejsca pogrupowane wg dzielnicy (do panelu).
  const placesByDistrict = new Map<string, PlaceItem[]>();
  for (const f of places.features) {
    const d = f.properties?.district as string | undefined;
    if (!d) continue;
    const item = {
      name: f.properties?.name as string,
      category: f.properties?.category as string,
    };
    placesByDistrict.set(d, [...(placesByDistrict.get(d) ?? []), item]);
    // Dodatkowo grupowanie po GMINIE — klik w gminę Bilbao w trybie przestępczości
    // ma pokazać jej miejsca, a te są przypisane do dzielnic.
    const city = f.properties?.city as string | undefined;
    if (city && city !== d) {
      placesByDistrict.set(city, [...(placesByDistrict.get(city) ?? []), item]);
    }
  }

  const openDistrict = (code: string) =>
    showDistrict(
      el("sidebar"),
      code,
      nameByCode.get(code) ?? code,
      data.safety,
      placesByDistrict.get(code) ?? [],
      data.sources,
      data.reference,
      data.cityWide,
    );

  const categories = [
    ...new Set(places.features.map((f) => f.properties?.category as string)),
  ].filter(Boolean);

  // Warstwy mapy zależą od WebGL/stylu — dołączamy je, gdy mapa jest gotowa.
  // Kontroler filtra kategorii jest dostępny dopiero po dodaniu warstwy.
  let setCategories: ((active: Set<string>) => void) | undefined;
  const addLayers = () => {
    addDistrictLayers(map, data.municipalities, data.districts, openDistrict);
    setCategories = addPlacesLayer(map, places).setActiveCategories;
    // Etykiety dzielnic na sam wierzch: klastry miejsc są nieprzezroczystymi
    // kołami rysowanymi później i zasłaniały nazwy trzech dzielnic.
    map.moveLayer("districts-label");
    map.moveLayer("municipalities-label");
  };
  if (map.isStyleLoaded()) addLayers();
  else map.once("load", addLayers);

  // --- UI renderujemy NATYCHMIAST po danych (niezależnie od gotowości mapy) ---
  // Braki liczymy na warstwie, która NIESIE KOLOR danej metryki — inaczej licznik
  // rozjeżdża się z tym, co widać. Przestępczość koloruje gminy (9), więc dzielnice
  // bez własnej stopy nie są dziurą. Percepcja koloruje dzielnice, a niezbadane
  // gminy zostają szare, więc liczymy po wszystkich 16 obszarach.
  const coverage = (metric: MetricId) =>
    metric === "crime_rate"
      ? // Warstwa gmin ma już dołączoną stopę w properties. Czytanie jej z
        // `safety` gubiłoby Bilbao, którego gmina nie jest obszarem wybieralnym
        // (reprezentują ją dzielnice), więc nie ma wpisu w `_units`.
        { items: data.municipalities.features, get: (f: GeoJSON.Feature) => f.properties?.crime_rate }
      : {
          items: areas,
          get: (f: GeoJSON.Feature) => data.safety[f.properties?.code as string]?.perception,
        };

  const missingFor = (metric: MetricId) => {
    const { items, get } = coverage(metric);
    return items.filter((f) => get(f) == null).length;
  };

  // Legenda zależy od aktywnej metryki: inna jednostka, inny kierunek skali
  // i inna liczba obszarów bez danych.
  const drawLegend = (metric: MetricId) => {
    renderLegend(el("legend"), categories, {
      metric,
      missing: missingFor(metric),
      total: coverage(metric).items.length,
    });
    el("legend").querySelector("#methodology-btn")?.addEventListener("click", openMethodology);
  };
  drawLegend(DEFAULT_METRIC);
  const active = new Set(categories);
  const items: FilterItem[] = categories.map((c) => ({
    id: c,
    label: CATEGORY_LABELS[c] ?? c,
    color: CATEGORY_COLORS[c],
    checked: true,
  }));
  renderFilters(el("filters"), items, (id, visible) => {
    if (visible) active.add(id);
    else active.delete(id);
    setCategories?.(active);
  });

  el("loading")?.remove();

  // Badge mówi, ILE obszarów nie ma danych dla domyślnej metryki. Brak pomiaru
  // musi być widoczny od razu, a nie dopiero po kliknięciu w obszar.
  if (data.geometryPlaceholder) {
    const badge = document.createElement("div");
    badge.className = "demo-badge";
    badge.textContent = "⚠ Dane demonstracyjne (placeholder)";
    badge.title = "Uruchom `npm run etl`, aby wgrać realne dane z OpenStreetMap";
    document.getElementById("app")?.appendChild(badge);
  } else {
    // Każda metryka jest rysowana na swoim poziomie pomiaru, więc nie ma już
    // szarych plam. Zostaje jedna rzecz warta powiedzenia od razu: percepcję
    // bada tylko Bilbao.
    const badge = document.createElement("div");
    badge.className = "demo-badge";
    badge.textContent = "ⓘ Percepcja: tylko Bilbao · Przestępczość: wszystkie gminy";
    badge.title =
      "Każdy wskaźnik jest pokazany na poziomie, na którym go zmierzono. " +
      "Szczegóły w panelu „Skąd te dane?”.";
    document.getElementById("app")?.appendChild(badge);
  }

  renderControls(
    el("controls"),
    areas.map((f) => ({
      code: f.properties?.code as string,
      name: labelOf(f),
    })),
    {
      onSearch: (code) => {
        const feature = districtByCode.get(code);
        if (feature?.geometry) map.fitBounds(bounds(feature.geometry), { padding: 60, maxZoom: 14 });
        openDistrict(code);
      },
      onModeChange: (field) => {
        setSafetyField(map, field);
        drawLegend(field as MetricId);
      },
    },
  );
}

bootstrap().catch((err) => {
  console.error(err);
  el("loading")?.remove();
  el("map").innerHTML = `<div class="error">Błąd ładowania danych: ${err.message}</div>`;
});
