import maplibregl from "maplibre-gl";
import { safetyFillColor, type SafetyField } from "./safety";
import { LABEL_FONT, METRICS } from "../config";

const MUNI = "municipalities";
const SRC = "districts";

/**
 * Przełącza metrykę.
 *
 * Choropleth rysowany jest WYŁĄCZNIE na gminach, bo tylko tam przestępczość jest
 * mierzona. Percepcja nie jest kolorem: jej rozpiętość między dzielnicami to
 * 0,39 pkt na skali 0–10 (1,07×), więc gradient udawałby różnicę, której nie ma.
 * Zamiast tego pokazujemy liczby na dzielnicach.
 */
export function setSafetyField(map: maplibregl.Map, field: SafetyField): void {
  if (!map.getLayer("municipalities-fill")) return; // warstwy jeszcze nie dodane
  const crime = field === "crime_rate";

  map.setPaintProperty(
    "municipalities-fill",
    "fill-color",
    crime
      ? (safetyFillColor("crime_rate") as maplibregl.ExpressionSpecification)
      : "#e8eaed",
  );
  map.setPaintProperty("municipalities-fill", "fill-opacity", crime ? 0.72 : 0.35);

  // Etykiety z wartością percepcji tylko w trybie percepcji.
  map.setLayoutProperty("districts-value", "visibility", crime ? "none" : "visible");
  // W trybie przestępczości granice dzielnic zostają cienką kreską — nadal można
  // je kliknąć (grupują miejsca), ale nie sugerują własnej wartości.
  map.setPaintProperty("districts-outline", "line-width", crime ? 0.6 : 1.4);
  map.setPaintProperty("districts-outline", "line-dasharray", crime ? [2, 2] : [1]);
}

/**
 * Dodaje warstwy gmin (choropleth) i dzielnic (granice, etykiety, interakcje).
 * `onSelect(code)` dostaje kod klikniętego obszaru.
 */
export function addDistrictLayers(
  map: maplibregl.Map,
  municipalities: GeoJSON.FeatureCollection,
  districts: GeoJSON.FeatureCollection,
  onSelect: (code: string) => void,
): void {
  map.addSource(MUNI, { type: "geojson", data: municipalities, promoteId: "code" });
  map.addSource(SRC, { type: "geojson", data: districts, promoteId: "code" });

  map.addLayer({
    id: "municipalities-fill",
    type: "fill",
    source: MUNI,
    paint: { "fill-color": "#e8eaed", "fill-opacity": 0.35 },
  });

  map.addLayer({
    id: "municipalities-outline",
    type: "line",
    source: MUNI,
    paint: { "line-color": "#ffffff", "line-width": 1.6 },
  });

  const ONLY_DISTRICTS: maplibregl.FilterSpecification = ["==", ["get", "level"], "district"];

  map.addLayer({
    id: "districts-fill",
    type: "fill",
    filter: ONLY_DISTRICTS,
    // Przezroczysta warstwa trafień: dzielnice muszą być klikalne w obu trybach,
    // ale nie mogą nieść własnego koloru — nie mają własnej wartości.
    source: SRC,
    paint: {
      "fill-color": "#000000",
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.06,
        0,
      ],
    },
  });

  map.addLayer({
    id: "districts-outline",
    type: "line",
    source: SRC,
    filter: ONLY_DISTRICTS,
    paint: {
      "line-color": "#ffffff",
      "line-width": 1.4,
      "line-dasharray": [1],
    },
  });

  map.addLayer({
    id: "districts-label",
    type: "symbol",
    source: SRC,
    filter: ONLY_DISTRICTS,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-font": LABEL_FONT,
      "text-offset": [0, -0.7],
    },
    paint: {
      "text-color": "#1b1b1b",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.4,
    },
  });

  // Wartość percepcji jako liczba — jedyny uczciwy sposób pokazania różnicy 0,39 pkt.
  map.addLayer({
    id: "districts-value",
    type: "symbol",
    source: SRC,
    // Tylko dzielnice mają zbadaną percepcję, więc ten sam filtr wystarcza —
    // nie trzeba sprawdzać null-a w wyrażeniu.
    filter: ONLY_DISTRICTS,
    layout: {
      "text-field": ["concat", ["to-string", ["get", "perception"]], "/10"],
      "text-size": 14,
      "text-font": LABEL_FONT,
      "text-offset": [0, 0.7],
    },
    paint: {
      "text-color": "#14324f",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.6,
    },
  });

  wireInteractions(map, onSelect);
}

function wireInteractions(map: maplibregl.Map, onSelect: (code: string) => void): void {
  let hovered: string | number | undefined;
  let selected: string | number | undefined;
  let hoveredSrc = SRC;

  const tooltip = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 8,
    className: "district-tooltip",
  });

  const setState = (
    id: string | number | undefined,
    source: string,
    state: Record<string, boolean>,
  ) => {
    if (id === undefined) return;
    map.setFeatureState({ source, id }, state);
  };

  const fmt = (v: unknown, suffix: string) =>
    v == null ? "brak danych" : `${String(v).replace(".", ",")}${suffix}`;

  // Dzielnice leżą NA gminach, więc pytamy najpierw o nie — inaczej klik w Bilbao
  // trafiałby w gminę i gubił dzielnicę.
  const topFeature = (e: maplibregl.MapMouseEvent) => {
    const hit = map.queryRenderedFeatures(e.point, {
      layers: ["districts-fill", "municipalities-fill"],
    });
    return hit[0];
  };

  map.on("mousemove", (e) => {
    const feature = topFeature(e);
    if (!feature) {
      map.getCanvas().style.cursor = "";
      tooltip.remove();
      setState(hovered, hoveredSrc, { hover: false });
      hovered = undefined;
      return;
    }
    map.getCanvas().style.cursor = "pointer";
    const p = feature.properties ?? {};
    const src = feature.layer.id === "districts-fill" ? SRC : MUNI;

    tooltip
      .setLngLat(e.lngLat)
      .setHTML(
        `<strong>${p.name ?? "—"}</strong><br/>` +
          `${METRICS.perception.short}: ${fmt(p.perception, "/10")}<br/>` +
          `${METRICS.crime_rate.short}: ${fmt(p.crime_rate, "‰")}`,
      )
      .addTo(map);

    if (feature.id === hovered && src === hoveredSrc) return;
    setState(hovered, hoveredSrc, { hover: false });
    hovered = feature.id;
    hoveredSrc = src;
    setState(hovered, hoveredSrc, { hover: true });
  });

  map.on("click", (e) => {
    const feature = topFeature(e);
    const code = feature?.properties?.code as string | undefined;
    if (!code) return;
    const src = feature.layer.id === "districts-fill" ? SRC : MUNI;
    setState(selected, hoveredSrc, { selected: false });
    selected = feature.id;
    setState(selected, src, { selected: true });
    onSelect(code);
  });
}
