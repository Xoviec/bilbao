import maplibregl from "maplibre-gl";
import { CATEGORY_COLORS } from "../config";

/** Wyrażenie koloru punktu wg pola `category`. */
function categoryColor(): unknown {
  const match: unknown[] = ["match", ["get", "category"]];
  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    match.push(cat, color);
  }
  match.push("#666666"); // domyślny
  return match;
}

/**
 * Dodaje warstwę punktową (POI lub aktywności) z klasteryzacją.
 * `id` służy jako prefiks źródła/warstw, aby uniknąć kolizji.
 */
export function addPointLayer(
  map: maplibregl.Map,
  id: string,
  data: GeoJSON.FeatureCollection,
): void {
  map.addSource(id, {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius: 45,
    clusterMaxZoom: 14,
  });

  map.addLayer({
    id: `${id}-clusters`,
    type: "circle",
    source: id,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#3b5ba5",
      "circle-opacity": 0.8,
      "circle-radius": ["step", ["get", "point_count"], 14, 10, 20, 30, 26],
    },
  });

  map.addLayer({
    id: `${id}-cluster-count`,
    type: "symbol",
    source: id,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 12,
      "text-font": ["Noto Sans Regular"],
    },
    paint: { "text-color": "#ffffff" },
  });

  map.addLayer({
    id: `${id}-points`,
    type: "circle",
    source: id,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": categoryColor() as maplibregl.ExpressionSpecification,
      "circle-radius": 6,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
    },
  });

  // Popup po kliknięciu pojedynczego punktu.
  map.on("click", `${id}-points`, (e) => {
    const f = e.features?.[0];
    if (!f) return;
    const p = f.properties ?? {};
    const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
    new maplibregl.Popup({ closeButton: true })
      .setLngLat(coords)
      .setHTML(`<strong>${p.name ?? "—"}</strong><br/><small>${p.category ?? ""}</small>`)
      .addTo(map);
  });

  map.on("mouseenter", `${id}-points`, () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", `${id}-points`, () => (map.getCanvas().style.cursor = ""));
}

/** Przełącza widoczność wszystkich warstw danego zbioru punktów. */
export function setPointLayerVisibility(map: maplibregl.Map, id: string, visible: boolean): void {
  const vis = visible ? "visible" : "none";
  for (const suffix of ["clusters", "cluster-count", "points"]) {
    const layer = `${id}-${suffix}`;
    if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", vis);
  }
}
