// Centralna konfiguracja aplikacji.

// Widok mapy. Centrum i maxBounds NIE są tu wpisane na sztywno — wyliczamy je
// z zakresu wczytanych danych (patrz `collectionBounds` w data/geo.ts), bo zbiór
// gmin się zmienia i zaszyty bbox Bilbao przyciąłby sąsiadów poza kadr.
export const VIEW = {
  minZoom: 9,
  maxZoom: 18,
  /** Margines wokół danych przy ustalaniu maxBounds (ułamek rozmiaru zakresu). */
  boundsPadding: 0.08,
  /** Margines w pikselach przy początkowym dopasowaniu kamery do danych. */
  fitPadding: 24,
};

// Darmowy styl kafli wektorowych OSM (bez klucza API).
export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Fonty etykiet. Muszą istnieć w glyphs aktywnego stylu.
// Styl Liberty (i raster fallback poniżej) dostarczają "Noto Sans Regular".
export const LABEL_FONT = ["Noto Sans Regular"];

// Awaryjny styl rastrowy (gdy podstawowy dostawca kafli jest niedostępny).
// Etykiety miejsc są wtopione w rastr; glyphs zapewniają nasze warstwy symboli.
export const FALLBACK_STYLE = {
  version: 8 as const,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export const DATA = {
  districts: "data/districts.geojson",
  municipalities: "data/municipalities.geojson",
  ineDistricts: "data/ine-districts.geojson",
  safety: "data/safety.json",
  activities: "data/activities.geojson",
  poi: "data/poi.geojson",
  cities: "data/cities.json",
};

// Paleta choroplethu: od gorszego (czerwień) do lepszego (zieleń).
// Diverging, bezpieczna dla daltonistów.
export const RAMP = ["#d73027", "#fc8d59", "#fee08b", "#91cf60", "#1a9850"];

export type MetricId = "income";

export interface Metric {
  id: MetricId;
  field: string;
  label: string;
  unit: string;
  domain: [number, number];
  higherIsBetter: boolean;
  short: string;
  ends?: [string, string];
}

// JEDEN wskaźnik, JEDNA jednostka — dystrykt INE (patrz docs/METRIC_DECISION.md).
// To jedyna jednostka, w której Bilbao i wszyscy sąsiedzi mają ten sam podział
// i ten sam pomiar: 31 obszarów, 31 różnych wartości, zero powtórzeń i zero
// szarych plam.
export const METRICS: Record<MetricId, Metric> = {
  income: {
    id: "income",
    field: "income",
    label: "Dochód netto na osobę",
    unit: " €",
    // Obejmuje wszystkie 31 dystryktów (15 034 – 30 762 €).
    domain: [15000, 31000],
    higherIsBetter: true,
    short: "Dochód",
    ends: ["niższy", "wyższy"],
  },
};

export const DEFAULT_METRIC: MetricId = "income";

// Kolory kategorii aktywności / POI.
export const CATEGORY_COLORS: Record<string, string> = {
  green: "#2e9e5b",
  sport: "#2b7bba",
  culture: "#8e5db0",
  nightlife: "#d9534f",
  food: "#e8871a",
  sight: "#c0392b",
};

export const CATEGORY_LABELS: Record<string, string> = {
  green: "Tereny zielone",
  sport: "Sport",
  culture: "Kultura",
  nightlife: "Nocne życie",
  food: "Gastronomia",
  sight: "Warte zobaczenia",
};
