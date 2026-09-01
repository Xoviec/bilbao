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
  safety: "data/safety.json",
  activities: "data/activities.geojson",
  poi: "data/poi.geojson",
  cities: "data/cities.json",
};

// Paleta choroplethu: od gorszego (czerwień) do lepszego (zieleń).
// Diverging, bezpieczna dla daltonistów.
export const RAMP = ["#d73027", "#fc8d59", "#fee08b", "#91cf60", "#1a9850"];

export type MetricId = "crime_rate";

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

// JEDEN wskaźnik, JEDNA jednostka — patrz docs/METRIC_DECISION.md.
// Przestępczość jest mierzona per gmina i tylko tam jest rysowana: 9 obszarów,
// 9 niezależnych pomiarów, zero powtórzeń. Percepcja wypadła z mapy, bo istnieje
// wyłącznie dla Bilbao i z definicji nie może być jednolita.
export const METRICS: Record<MetricId, Metric> = {
  crime_rate: {
    id: "crime_rate",
    field: "crime_rate",
    label: "Przestępstwa na 1000 mieszkańców",
    unit: "‰",
    // Obejmuje wszystkie 9 gmin (28,7–74,8), średnia Bizkaia 49,6 pośrodku.
    domain: [20, 80],
    higherIsBetter: false,
    short: "Przestępczość",
    ends: ["mniej", "więcej"],
  },
};

export const DEFAULT_METRIC: MetricId = "crime_rate";

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
