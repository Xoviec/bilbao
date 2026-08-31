import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

import { createMap } from "./map";
import { loadAllData } from "./data/loader";
import { addDistrictLayers } from "./layers/districts";
import { addPlacesLayer } from "./layers/places";
import { renderLegend } from "./ui/legend";
import { showDistrict } from "./ui/sidebar";
import { renderFilters, type FilterItem } from "./ui/filters";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./config";

const el = (id: string) => document.getElementById(id) as HTMLElement;

async function bootstrap(): Promise<void> {
  const map = await createMap("map");

  // Dane i mapa ładują się równolegle; łączymy po 'load'.
  const [data] = await Promise.all([
    loadAllData(),
    new Promise<void>((resolve) => map.on("load", () => resolve())),
  ]);

  const nameByCode = new Map<string, string>(
    data.districts.features.map((f) => [
      f.properties?.code as string,
      f.properties?.name as string,
    ]),
  );

  addDistrictLayers(map, data.districts, (code) => {
    showDistrict(el("sidebar"), code, nameByCode.get(code) ?? code, data.safety);
  });

  // Wspólne źródło miejsc: POI + aktywności.
  const places: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [...data.poi.features, ...data.activities.features],
  };
  const { setActiveCategories } = addPlacesLayer(map, places);

  // Kategorie faktycznie obecne w danych.
  const categories = [
    ...new Set(places.features.map((f) => f.properties?.category as string)),
  ].filter(Boolean);

  renderLegend(el("legend"), categories);

  // Filtry per kategoria (współdzielony, mutowalny zbiór aktywnych).
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
    setActiveCategories(active);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  el("map").innerHTML = `<div class="error">Błąd ładowania danych: ${err.message}</div>`;
});
