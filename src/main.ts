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
import { CATEGORY_COLORS, CATEGORY_LABELS, VIEW, METRICS, DEFAULT_METRIC, type MetricId } from "./config";

const el = (id: string) => document.getElementById(id) as HTMLElement;

async function bootstrap(): Promise<void> {
  // Sondowanie dostawcy kafli i pobieranie danych biegną równolegle — oba są
  // sieciowe i niezależne, więc szeregowanie ich podwajałoby czas startu.
  const [style, data] = await Promise.all([resolveStyle(), loadAllData()]);

  // Kadr wynika z danych, nie ze stałej: zbiór gmin bywa różny (patrz
  // etl/cities.json), a zaszyty bbox Bilbao ucinałby sąsiadów.
  const dataBounds = collectionBounds(data.districts);
  const map = createMap("map", style, {
    bounds: dataBounds,
    maxBounds: padBounds(dataBounds, VIEW.boundsPadding),
  });

  const districtByCode = new Map(
    data.districts.features.map((f) => [f.properties?.code as string, f]),
  );
  // Etykieta jednostki. Dzielnicę poprzedzamy nazwą gminy, bo lista miesza dwa
  // poziomy (dzielnice Bilbao + całe gminy) i samo "Abando" nie mówi, gdzie to jest.
  const labelOf = (f: GeoJSON.Feature): string => {
    const name = f.properties?.name as string;
    const cityName = f.properties?.cityName as string | undefined;
    return f.properties?.level === "district" && cityName ? `${cityName} — ${name}` : name;
  };

  const nameByCode = new Map(
    data.districts.features.map((f) => [f.properties?.code as string, labelOf(f)]),
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
    const arr = placesByDistrict.get(d) ?? [];
    arr.push({ name: f.properties?.name as string, category: f.properties?.category as string });
    placesByDistrict.set(d, arr);
  }

  const openDistrict = (code: string) =>
    showDistrict(
      el("sidebar"),
      code,
      nameByCode.get(code) ?? code,
      data.safety,
      placesByDistrict.get(code) ?? [],
      data.sources,
    );

  const categories = [
    ...new Set(places.features.map((f) => f.properties?.category as string)),
  ].filter(Boolean);

  // Warstwy mapy zależą od WebGL/stylu — dołączamy je, gdy mapa jest gotowa.
  // Kontroler filtra kategorii jest dostępny dopiero po dodaniu warstwy.
  let setCategories: ((active: Set<string>) => void) | undefined;
  const addLayers = () => {
    addDistrictLayers(map, data.districts, openDistrict);
    setCategories = addPlacesLayer(map, places).setActiveCategories;
  };
  if (map.isStyleLoaded()) addLayers();
  else map.once("load", addLayers);

  // --- UI renderujemy NATYCHMIAST po danych (niezależnie od gotowości mapy) ---
  const levels = new Set(data.districts.features.map((f) => f.properties?.level));
  const missingFor = (metric: MetricId) =>
    data.districts.features.filter((f) => f.properties?.[METRICS[metric].field] == null).length;

  // Legenda zależy od aktywnej metryki: inna jednostka, inny kierunek skali
  // i inna liczba obszarów bez danych.
  const drawLegend = (metric: MetricId) => {
    renderLegend(el("legend"), categories, {
      metric,
      missing: missingFor(metric),
      total: data.districts.features.length,
      mixedResolution: levels.size > 1,
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
  const badgeMissing = missingFor(DEFAULT_METRIC);
  if (data.geometryPlaceholder || badgeMissing) {
    const badge = document.createElement("div");
    badge.className = "demo-badge";
    badge.textContent = data.geometryPlaceholder
      ? "⚠ Dane demonstracyjne (placeholder)"
      : `⚠ ${badgeMissing} z ${data.districts.features.length} obszarów bez danych`;
    badge.title = data.geometryPlaceholder
      ? "Uruchom `npm run etl`, aby wgrać realne dane z OpenStreetMap"
      : "Percepcja bezpieczeństwa jest badana tylko w Bilbao; statystyki " +
        "przestępczości tylko dla gmin powyżej 20 000 mieszkańców. Szczegóły w panelu „Skąd te dane?”.";
    document.getElementById("app")?.appendChild(badge);
  }

  renderControls(
    el("controls"),
    data.districts.features.map((f) => ({
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
