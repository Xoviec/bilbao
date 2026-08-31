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
  const data = await loadAllData();

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

  // Wspólne źródło miejsc: POI + aktywności.
  const places: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [...data.poi.features, ...data.activities.features],
  };
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
  renderLegend(el("legend"), categories);

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
