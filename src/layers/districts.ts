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

/** Etykieta z nazwą i wartością metryki (polski separator dziesiętny). */
const valueLabel = (field: string, suffix: string): maplibregl.ExpressionSpecification =>
  [
    "concat",
    ["get", "name"],
    "\n",
    ["number-format", ["get", field], { locale: "pl-PL", "min-fraction-digits": 1, "max-fraction-digits": 1 }],
    suffix,
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
  map.setPaintProperty("municipalities-fill", "fill-opacity", crime ? 0.48 : 0.22);

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
    crime ? 0.06 : 0.62,
    crime ? 0 : 0.48,
  ] as maplibregl.ExpressionSpecification);

  map.setLayoutProperty("districts-label", "text-field", districtLabel(!crime));

  // W trybie przestępczości granice i nazwy dzielnic ZNIKAJĄ. Rysowanie ich nad
  // jednolicie pokolorowanym Bilbao obiecywało zróżnicowanie, którego w danych
  // nie ma — mapa wyglądała na zepsutą. Widok przestępczości to 9 gmin i tyle;
  // dzielnice zostają tylko jako niewidoczna warstwa trafień (klik nadal działa).
  const show = (id: string, on: boolean) =>
    map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  show("districts-outline", !crime);
  show("districts-label", !crime);
  show("municipalities-label", crime);
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
    paint: { "fill-color": "#e8eaed", "fill-opacity": 0.22 },
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
        0.62,
        0.48,
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

  // Nazwa gminy + jej stopa przestępczości. Widoczna tylko w trybie przestępczości,
  // gdzie gmina JEST jednostką — wtedy widać dziewięć różnych wartości zamiast
  // jednej rozmazanej po dzielnicach.
  map.addLayer({
    id: "municipalities-label",
    type: "symbol",
    source: MUNI,
    layout: {
      "text-field": valueLabel("crime_rate", "‰"),
      "text-size": 13,
      "text-font": LABEL_FONT,
      "text-line-height": 1.3,
      "text-padding": 6,
      visibility: "none",
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

    // Dzielnica nie ma własnej stopy przestępczości — pokazujemy wartość gminy
    // podpisaną jej nazwą, żeby nie wyglądała na pomiar tej dzielnicy.
    const crimeLine =
      p.crime_rate != null
        ? `${METRICS.crime_rate.short}: ${fmt(p.crime_rate, "‰")}`
        : p.city_crime_rate != null
          ? `${METRICS.crime_rate.short} (cała gmina ${p.city_name ?? ""}): ` +
            `${fmt(p.city_crime_rate, "‰")}`
          : `${METRICS.crime_rate.short}: brak danych`;

    tooltip
      .setLngLat(e.lngLat)
      .setHTML(
        `<strong>${p.name ?? "—"}</strong><br/>` +
          `${METRICS.perception.short}: ${fmt(p.perception, "/10")}<br/>` +
          crimeLine,
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
