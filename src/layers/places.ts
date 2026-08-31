import maplibregl from "maplibre-gl";
import { LABEL_FONT } from "../config";
import { registerMarkerIcons } from "../markers";

const SRC = "places";

/**
 * Warstwa miejsc (POI + aktywności) w jednym źródle, kolorowana/ikonowana
 * wg kategorii, z klasteryzacją. Zwraca kontroler filtra kategorii.
 */
export function addPlacesLayer(
  map: maplibregl.Map,
  data: GeoJSON.FeatureCollection,
): { setActiveCategories: (active: Set<string>) => void } {
  const all = data.features;
  registerMarkerIcons(map);

  map.addSource(SRC, {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius: 45,
    clusterMaxZoom: 14,
  });

  map.addLayer({
    id: `${SRC}-clusters`,
    type: "circle",
    source: SRC,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#3b5ba5",
      "circle-opacity": 0.85,
      "circle-radius": ["step", ["get", "point_count"], 14, 10, 20, 30, 26],
    },
  });

  map.addLayer({
    id: `${SRC}-cluster-count`,
    type: "symbol",
    source: SRC,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 12,
      "text-font": LABEL_FONT,
    },
    paint: { "text-color": "#ffffff" },
  });

  map.addLayer({
    id: `${SRC}-points`,
    type: "symbol",
    source: SRC,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["concat", "pin-", ["get", "category"]],
      "icon-size": 0.5,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
    },
  });

  // Rozwinięcie klastra po kliknięciu.
  map.on("click", `${SRC}-clusters`, async (e) => {
    const f = map.queryRenderedFeatures(e.point, { layers: [`${SRC}-clusters`] })[0];
    const clusterId = f?.properties?.cluster_id;
    const src = map.getSource(SRC) as maplibregl.GeoJSONSource;
    const zoom = await src.getClusterExpansionZoom(clusterId);
    map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
  });

  // Popup pojedynczego miejsca.
  map.on("click", `${SRC}-points`, (e) => {
    const f = e.features?.[0];
    if (!f) return;
    const p = f.properties ?? {};
    const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
    new maplibregl.Popup({ closeButton: true })
      .setLngLat(coords)
      .setHTML(`<strong>${p.name ?? "—"}</strong><br/><small>${p.category ?? ""}</small>`)
      .addTo(map);
  });

  for (const id of [`${SRC}-points`, `${SRC}-clusters`]) {
    map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
  }

  // Filtr kategorii: przez podmianę danych źródła (klastry respektują filtr).
  const setActiveCategories = (active: Set<string>) => {
    const src = map.getSource(SRC) as maplibregl.GeoJSONSource;
    src.setData({
      type: "FeatureCollection",
      features: all.filter((ft) => active.has(ft.properties?.category as string)),
    });
  };

  return { setActiveCategories };
}
