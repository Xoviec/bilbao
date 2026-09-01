import maplibregl from "maplibre-gl";
import { safetyFillColor } from "./safety";
import { LABEL_FONT, METRICS } from "../config";

const MUNI = "municipalities";
// Warstwy miejsc mają własne handlery kliknięcia (popup, rozwijanie klastra).
// Nasz handler jest globalny, więc musi im ustąpić — inaczej jeden klik w pinezkę
// otwiera JEDNOCZEŚNIE popup miejsca i panel obszaru.
const PLACE_LAYERS = ["places-points", "places-clusters"];

/** Szerokość obrysu zależna od stanu: zaznaczenie > najechanie > spoczynek. */
const outlineWidth = (base: number): maplibregl.ExpressionSpecification =>
  [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    base + 2,
    ["boolean", ["feature-state", "hover"], false],
    base + 1,
    base,
  ] as maplibregl.ExpressionSpecification;

/**
 * Warstwy obszarów.
 *
 * JEDNA jednostka — gmina — bo tylko na tym poziomie mierzona jest przestępczość
 * (patrz docs/METRIC_DECISION.md). Dzielnice Bilbao nie są tu rysowane: nie mają
 * własnego pomiaru, a osiem kształtów z jedną wartością czytało się jak zepsute
 * dane. Ich dane o percepcji żyją w panelu gminy Bilbao.
 */
export function addAreaLayers(
  map: maplibregl.Map,
  municipalities: GeoJSON.FeatureCollection,
  onSelect: (code: string) => void,
): void {
  map.addSource(MUNI, { type: "geojson", data: municipalities, promoteId: "code" });

  map.addLayer({
    id: "municipalities-fill",
    type: "fill",
    source: MUNI,
    paint: {
      "fill-color": safetyFillColor() as maplibregl.ExpressionSpecification,
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.62,
        0.48,
      ],
    },
  });

  map.addLayer({
    id: "municipalities-outline",
    type: "line",
    source: MUNI,
    paint: { "line-color": "#ffffff", "line-width": outlineWidth(1.6) },
  });

  map.addLayer({
    id: "municipalities-label",
    type: "symbol",
    source: MUNI,
    layout: {
      "text-field": [
        "concat",
        ["get", "name"],
        "\n",
        // Polski separator dziesiętny, zgodny z panelem i tooltipem.
        [
          "number-format",
          ["get", "crime_rate"],
          { locale: "pl-PL", "min-fraction-digits": 1, "max-fraction-digits": 1 },
        ],
        METRICS.crime_rate.unit,
      ],
      "text-size": 13,
      "text-font": LABEL_FONT,
      "text-line-height": 1.3,
      "text-padding": 6,
    },
    paint: {
      "text-color": "#1b1b1b",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2.2,
    },
  });

  wireInteractions(map, onSelect);
}

function wireInteractions(map: maplibregl.Map, onSelect: (code: string) => void): void {
  let hovered: string | number | undefined;
  let selected: string | number | undefined;

  const tooltip = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 8,
    className: "district-tooltip",
  });

  const setState = (id: string | number | undefined, state: Record<string, boolean>) => {
    if (id === undefined) return;
    map.setFeatureState({ source: MUNI, id }, state);
  };

  const fmt = (v: unknown) =>
    typeof v === "number"
      ? `${v.toFixed(1).replace(".", ",")}${METRICS.crime_rate.unit}`
      : "brak danych";

  /** Czy pod kursorem jest miejsce — wtedy klik należy do warstwy miejsc. */
  const overPlace = (e: maplibregl.MapMouseEvent) => {
    const layers = PLACE_LAYERS.filter((l) => map.getLayer(l));
    if (!layers.length) return false;
    return map.queryRenderedFeatures(e.point, { layers }).length > 0;
  };

  const areaAt = (e: maplibregl.MapMouseEvent) =>
    map.getLayer("municipalities-fill")
      ? map.queryRenderedFeatures(e.point, { layers: ["municipalities-fill"] })[0]
      : undefined;

  map.on("mousemove", (e) => {
    const feature = areaAt(e);
    if (!feature) {
      map.getCanvas().style.cursor = "";
      tooltip.remove();
      setState(hovered, { hover: false });
      hovered = undefined;
      return;
    }
    map.getCanvas().style.cursor = "pointer";
    const p = feature.properties ?? {};

    tooltip
      .setLngLat(e.lngLat)
      .setHTML(
        `<strong>${p.name ?? "—"}</strong><br/>` +
          `${METRICS.crime_rate.short}: ${fmt(p.crime_rate)}`,
      )
      .addTo(map);

    if (feature.id === hovered) return;
    setState(hovered, { hover: false });
    hovered = feature.id;
    setState(hovered, { hover: true });
  });

  map.on("click", (e) => {
    if (overPlace(e)) return;
    const feature = areaAt(e);
    const code = feature?.properties?.code as string | undefined;
    if (!code) return;
    setState(selected, { selected: false });
    selected = feature!.id;
    setState(selected, { selected: true });
    onSelect(code);
  });
}
