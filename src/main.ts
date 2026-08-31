import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

import { createMap } from "./map";
import { loadAllData } from "./data/loader";
import { bounds } from "./data/geo";
import { addDistrictLayers, setSafetyField } from "./layers/districts";
import { addPlacesLayer } from "./layers/places";
import { renderLegend } from "./ui/legend";
import { showDistrict } from "./ui/sidebar";
import { renderFilters, type FilterItem } from "./ui/filters";
import { renderControls } from "./ui/controls";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./config";

const el = (id: string) => document.getElementById(id) as HTMLElement;

async function bootstrap(): Promise<void> {
  const map = await createMap("map");

  // Dane i mapa ładują się równolegle; łączymy po 'load'.
  const [data] = await Promise.all([
    loadAllData(),
    new Promise<void>((resolve) => map.on("load", () => resolve())),
  ]);

  const districtByCode = new Map(
    data.districts.features.map((f) => [f.properties?.code as string, f]),
  );
  const nameByCode = new Map(
    data.districts.features.map((f) => [
      f.properties?.code as string,
      f.properties?.name as string,
    ]),
  );

  const openDistrict = (code: string) =>
    showDistrict(el("sidebar"), code, nameByCode.get(code) ?? code, data.safety);

  addDistrictLayers(map, data.districts, openDistrict);

  // Wspólne źródło miejsc: POI + aktywności.
  const places: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [...data.poi.features, ...data.activities.features],
  };
  const { setActiveCategories } = addPlacesLayer(map, places);

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

  // Kontrolki: wyszukiwarka dzielnicy + tryb dzień/noc.
  renderControls(
    el("controls"),
    data.districts.features.map((f) => ({
      code: f.properties?.code as string,
      name: f.properties?.name as string,
    })),
    {
      onSearch: (code) => {
        const feature = districtByCode.get(code);
        if (feature?.geometry) map.fitBounds(bounds(feature.geometry), { padding: 60, maxZoom: 14 });
        openDistrict(code);
      },
      onModeChange: (field) => setSafetyField(map, field),
    },
  );
}

bootstrap().catch((err) => {
  console.error(err);
  el("map").innerHTML = `<div class="error">Błąd ładowania danych: ${err.message}</div>`;
});
