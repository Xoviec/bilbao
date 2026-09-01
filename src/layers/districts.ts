import maplibregl from "maplibre-gl";
import { safetyFillColor, type SafetyField } from "./safety";
import { LABEL_FONT, METRICS } from "../config";

const MUNI = "municipalities";
const SRC = "districts";
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

/** Etykieta dzielnicy: sama nazwa albo nazwa + zmierzona percepcja. */
const districtLabel = (withValue: boolean): maplibregl.ExpressionSpecification =>
  (withValue
    ? [
        "concat",
        ["get", "name"],
        "\n",
        // number-format daje polski separator dziesiętny; zwykłe to-string
        // wypisywało "5.44" obok "5,44" w panelu.
        [
          "number-format",
          ["get", "perception"],
          { locale: "pl-PL", "min-fraction-digits": 2, "max-fraction-digits": 2 },
        ],
        "/10",
      ]
    : ["get", "name"]) as maplibregl.ExpressionSpecification;

/**
 * Przełącza metrykę. Każda jest rysowana na swoim poziomie pomiaru:
 *   - przestępczość → gminy (tam jest mierzona), dzielnice przezroczyste,
 *   - percepcja     → dzielnice Bilbao, gminy neutralnie szare (nie badano).
 *
 * Skala percepcji pokazuje ODCHYLENIE od średniej miasta, bo cała rozpiętość
 * między dzielnicami to 0,39 pkt na skali 0–10 — na skali bezwzględnej wszystkie
 * miałyby ten sam kolor. Legenda musi o tym mówić wprost (patrz `caveat`).
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

  // W trybie percepcji dzielnice DOSTAJĄ kolor (odchylenie od średniej miasta).
  // W trybie przestępczości muszą być przezroczyste, żeby było widać kolor gminy.
  map.setPaintProperty(
    "districts-fill",
    "fill-color",
    crime ? "#000000" : (safetyFillColor("perception") as maplibregl.ExpressionSpecification),
  );
  map.setPaintProperty("districts-fill", "fill-opacity", [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    crime ? 0.06 : 0.92,
    crime ? 0 : 0.78,
  ] as maplibregl.ExpressionSpecification);

  // Wartość percepcji jest częścią etykiety, a nie osobną warstwą symboli —
  // dwie warstwy konkurowały o miejsce i MapLibre wyrzucał nazwy dzielnic.
  map.setLayoutProperty("districts-label", "text-field", districtLabel(!crime));
  // W trybie przestępczości granice dzielnic zostają cienką kreską — nadal można
  // je kliknąć (grupują miejsca), ale nie sugerują własnej wartości.
  map.setPaintProperty("districts-outline", "line-width", outlineWidth(crime ? 0.6 : 1.4));
  map.setPaintProperty("districts-outline", "line-dasharray", crime ? [2, 2] : [1, 0]);
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
    paint: { "line-color": "#ffffff", "line-width": outlineWidth(1.6) },
  });

  const ONLY_DISTRICTS: maplibregl.FilterSpecification = ["==", ["get", "level"], "district"];

  map.addLayer({
    id: "districts-fill",
    type: "fill",
    filter: ONLY_DISTRICTS,
    // W trybie percepcji niesie kolor (odchylenie od średniej miasta); w trybie
    // przestępczości staje się przezroczystą warstwą trafień, bo dzielnica nie ma
    // własnej stopy przestępczości.
    source: SRC,
    paint: {
      "fill-color": safetyFillColor("perception") as maplibregl.ExpressionSpecification,
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.92,
        0.78,
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
      "line-width": outlineWidth(1.4),
      "line-dasharray": [1, 0],
    },
  });

  // JEDNA warstwa etykiet: nazwa, a w trybie percepcji nazwa + wartość.
  map.addLayer({
    id: "districts-label",
    type: "symbol",
    source: SRC,
    filter: ONLY_DISTRICTS,
    layout: {
      "text-field": districtLabel(true),
      "text-size": 12,
      "text-font": LABEL_FONT,
      "text-line-height": 1.3,
      // Etykieta dzielnicy jest ważniejsza niż podpisy podkładu i nie może
      // znikać pod klastrami miejsc — inaczej widać same liczby bez nazw.
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      "text-padding": 4,
      "symbol-sort-key": 0,
    },
    paint: {
      "text-color": "#14324f",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2.2,
    },
  });

  wireInteractions(map, onSelect);
}

function wireInteractions(map: maplibregl.Map, onSelect: (code: string) => void): void {
  let hovered: string | number | undefined;
  let hoveredSrc = SRC;
  let selected: string | number | undefined;
  // Źródło ZAZNACZONEGO obiektu trzeba pamiętać osobno od najechanego. Czyszczenie
  // starego zaznaczenia w źródle akurat najechanego obiektu gubiło je przy
  // przejściu dzielnica → gmina i dwa obszary zostawały podświetlone.
  let selectedSrc = SRC;

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

  /** Czy pod kursorem jest miejsce — wtedy klik należy do warstwy miejsc. */
  const overPlace = (e: maplibregl.MapMouseEvent) => {
    const layers = PLACE_LAYERS.filter((l) => map.getLayer(l));
    if (!layers.length) return false;
    return map.queryRenderedFeatures(e.point, { layers }).length > 0;
  };

  // Dzielnice leżą NA gminach, więc pytamy najpierw o nie — inaczej klik w Bilbao
  // trafiałby w gminę i gubił dzielnicę.
  const topFeature = (e: maplibregl.MapMouseEvent) => {
    const layers = ["districts-fill", "municipalities-fill"].filter((l) => map.getLayer(l));
    return map.queryRenderedFeatures(e.point, { layers })[0];
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
    // Klik w pinezkę lub klaster obsługuje warstwa miejsc — nie przestawiamy
    // wtedy panelu obszaru.
    if (overPlace(e)) return;
    const feature = topFeature(e);
    const code = feature?.properties?.code as string | undefined;
    if (!code) return;
    const src = feature.layer.id === "districts-fill" ? SRC : MUNI;
    setState(selected, selectedSrc, { selected: false });
    selected = feature.id;
    selectedSrc = src;
    setState(selected, selectedSrc, { selected: true });
    onSelect(code);
  });
}
