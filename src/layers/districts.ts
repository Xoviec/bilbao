import maplibregl from "maplibre-gl";
import { safetyFillColor } from "./safety";

const SRC = "districts";

/**
 * Dodaje warstwy dzielnic (wypełnienie choropleth, obrys, etykiety)
 * oraz interakcje hover/click. Wywołuje onSelect(code) po kliknięciu.
 */
export function addDistrictLayers(
  map: maplibregl.Map,
  data: GeoJSON.FeatureCollection,
  onSelect: (code: string) => void,
): void {
  map.addSource(SRC, { type: "geojson", data, promoteId: "code" });

  map.addLayer({
    id: "districts-fill",
    type: "fill",
    source: SRC,
    paint: {
      "fill-color": safetyFillColor() as maplibregl.ExpressionSpecification,
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.85,
        0.6,
      ],
    },
  });

  map.addLayer({
    id: "districts-outline",
    type: "line",
    source: SRC,
    paint: {
      "line-color": "#ffffff",
      "line-width": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        3,
        ["boolean", ["feature-state", "hover"], false],
        2,
        0.8,
      ],
    },
  });

  map.addLayer({
    id: "districts-label",
    type: "symbol",
    source: SRC,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 12,
      "text-font": ["Noto Sans Regular"],
    },
    paint: {
      "text-color": "#1b1b1b",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.4,
    },
  });

  wireInteractions(map, onSelect);
}

function wireInteractions(map: maplibregl.Map, onSelect: (code: string) => void): void {
  let hovered: string | number | undefined;
  let selected: string | number | undefined;

  const setState = (id: string | number | undefined, state: Record<string, boolean>) => {
    if (id === undefined) return;
    map.setFeatureState({ source: SRC, id }, state);
  };

  map.on("mousemove", "districts-fill", (e) => {
    map.getCanvas().style.cursor = "pointer";
    const id = e.features?.[0]?.id;
    if (id === hovered) return;
    setState(hovered, { hover: false });
    hovered = id;
    setState(hovered, { hover: true });
  });

  map.on("mouseleave", "districts-fill", () => {
    map.getCanvas().style.cursor = "";
    setState(hovered, { hover: false });
    hovered = undefined;
  });

  map.on("click", "districts-fill", (e) => {
    const feature = e.features?.[0];
    const id = feature?.id;
    const code = feature?.properties?.code as string | undefined;
    if (!code) return;
    setState(selected, { selected: false });
    selected = id;
    setState(selected, { selected: true });
    onSelect(code);
  });
}
