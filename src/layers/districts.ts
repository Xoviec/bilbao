import maplibregl from "maplibre-gl";
import { safetyFillColor } from "./safety";
import { LABEL_FONT, METRICS, type MetricId } from "../config";

const DIST = "districts";
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

/** Etykieta: nazwa + wartość z jednostką, żeby skal nie dało się pomylić. */
const label = (metric: MetricId, digits: number): maplibregl.ExpressionSpecification =>
  [
    "concat",
    ["get", "name"],
    "\n",
    [
      "number-format",
      ["get", METRICS[metric].field],
      { locale: "pl-PL", "min-fraction-digits": digits, "max-fraction-digits": digits },
    ],
    METRICS[metric].unit,
  ] as maplibregl.ExpressionSpecification;

const TEXT_PAINT = {
  "text-color": "#14324f",
  "text-halo-color": "#ffffff",
  "text-halo-width": 2.2,
};

/**
 * Warstwy obszarów: 8 dzielnic Bilbao + 8 gmin sąsiednich.
 *
 * Każdy obszar jest pokolorowany metryką mierzoną NA JEGO POZIOMIE:
 * dzielnice — percepcją bezpieczeństwa (jedyny pomiar robiony per dzielnica),
 * gminy — przestępczością na 1000 mieszkańców. Skale są rozdzielne i każda ma
 * własną legendę; na mapie każdy obszar nosi swoją liczbę z jednostką, więc nie
 * da się ich pomylić. Patrz docs/METRIC_DECISION.md.
 */
export function addAreaLayers(
  map: maplibregl.Map,
  districts: GeoJSON.FeatureCollection,
  municipalities: GeoJSON.FeatureCollection,
  onSelect: (code: string) => void,
): void {
  map.addSource(DIST, { type: "geojson", data: districts, promoteId: "code" });
  map.addSource(MUNI, { type: "geojson", data: municipalities, promoteId: "code" });

  // Gminy sąsiednie: Bilbao odpada, bo reprezentują je jego dzielnice.
  const NEIGHBOURS: maplibregl.FilterSpecification = ["!=", ["get", "code"], "bilbao"];
  const hoverOpacity: maplibregl.ExpressionSpecification = [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    0.62,
    0.46,
  ];

  map.addLayer({
    id: "muni-fill",
    type: "fill",
    source: MUNI,
    filter: NEIGHBOURS,
    paint: {
      "fill-color": safetyFillColor("crime_rate") as maplibregl.ExpressionSpecification,
      "fill-opacity": hoverOpacity,
    },
  });

  map.addLayer({
    id: "dist-fill",
    type: "fill",
    source: DIST,
    paint: {
      "fill-color": safetyFillColor("perception") as maplibregl.ExpressionSpecification,
      "fill-opacity": hoverOpacity,
    },
  });

  map.addLayer({
    id: "muni-outline",
    type: "line",
    source: MUNI,
    filter: NEIGHBOURS,
    paint: { "line-color": "#ffffff", "line-width": outlineWidth(1.6) },
  });

  map.addLayer({
    id: "dist-outline",
    type: "line",
    source: DIST,
    paint: { "line-color": "#ffffff", "line-width": outlineWidth(1.4) },
  });

  map.addLayer({
    id: "muni-label",
    type: "symbol",
    source: MUNI,
    filter: NEIGHBOURS,
    layout: {
      "text-field": label("crime_rate", 1),
      "text-size": 12,
      "text-font": LABEL_FONT,
      "text-line-height": 1.3,
      "text-padding": 6,
    },
    paint: TEXT_PAINT,
  });

  map.addLayer({
    id: "dist-label",
    type: "symbol",
    source: DIST,
    layout: {
      "text-field": label("perception", 2),
      "text-size": 12,
      "text-font": LABEL_FONT,
      "text-line-height": 1.3,
      "text-padding": 4,
    },
    paint: TEXT_PAINT,
  });

  wireInteractions(map, onSelect);
}

type Target = { id: string | number; src: string };

function wireInteractions(map: maplibregl.Map, onSelect: (code: string) => void): void {
  let hovered: Target | undefined;
  let selected: Target | undefined;

  const tooltip = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 8,
    className: "district-tooltip",
  });

  const setFlag = (t: Target | undefined, flag: "hover" | "selected", on: boolean) => {
    if (!t) return;
    map.setFeatureState({ source: t.src, id: t.id }, { [flag]: on });
  };

  const overPlace = (e: maplibregl.MapMouseEvent) => {
    const layers = PLACE_LAYERS.filter((l) => map.getLayer(l));
    if (!layers.length) return false;
    return map.queryRenderedFeatures(e.point, { layers }).length > 0;
  };

  // Dzielnice leżą na gminie Bilbao, ale ta jest odfiltrowana z warstwy gmin,
  // więc obie warstwy nigdy nie nakładają się na tym samym punkcie.
  const areaAt = (e: maplibregl.MapMouseEvent) => {
    const layers = ["dist-fill", "muni-fill"].filter((l) => map.getLayer(l));
    return map.queryRenderedFeatures(e.point, { layers })[0];
  };

  const fmt = (v: unknown, metric: MetricId, digits: number) =>
    typeof v === "number"
      ? `${v.toFixed(digits).replace(".", ",")}${METRICS[metric].unit}`
      : "brak danych";

  map.on("mousemove", (e) => {
    const feature = areaAt(e);
    if (!feature) {
      map.getCanvas().style.cursor = "";
      tooltip.remove();
      setFlag(hovered, "hover", false);
      hovered = undefined;
      return;
    }
    map.getCanvas().style.cursor = "pointer";
    const p = feature.properties ?? {};
    const isDistrict = feature.layer.id === "dist-fill";
    const metric: MetricId = isDistrict ? "perception" : "crime_rate";

    // Poziom pomiaru w tooltipie — czytelnik od razu wie, czego patrzy.
    tooltip
      .setLngLat(e.lngLat)
      .setHTML(
        `<strong>${p.name ?? "—"}</strong><br/>` +
          `${METRICS[metric].short}: ` +
          `${fmt(p[METRICS[metric].field], metric, isDistrict ? 2 : 1)}` +
          `<br/><small>pomiar per ${METRICS[metric].level}</small>`,
      )
      .addTo(map);

    const next: Target = {
      id: feature.id as string | number,
      src: isDistrict ? DIST : MUNI,
    };
    if (hovered && hovered.id === next.id && hovered.src === next.src) return;
    setFlag(hovered, "hover", false);
    hovered = next;
    setFlag(hovered, "hover", true);
  });

  map.on("click", (e) => {
    if (overPlace(e)) return;
    const feature = areaAt(e);
    const code = feature?.properties?.code as string | undefined;
    if (!code) return;
    setFlag(selected, "selected", false);
    selected = {
      id: feature.id as string | number,
      src: feature.layer.id === "dist-fill" ? DIST : MUNI,
    };
    setFlag(selected, "selected", true);
    onSelect(code);
  });
}
