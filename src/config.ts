// Centralna konfiguracja aplikacji.

export const BILBAO = {
  center: [-2.934, 43.263] as [number, number],
  zoom: 12.2,
  minZoom: 10,
  maxZoom: 18,
  // Ograniczenie widoku do okolic Bilbao (SW, NE).
  maxBounds: [
    [-3.05, 43.18],
    [-2.80, 43.34],
  ] as [[number, number], [number, number]],
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
  safety: "data/safety.json",
  activities: "data/activities.geojson",
  poi: "data/poi.geojson",
};

// Choropleth bezpieczeństwa (0–100). Paleta diverging, color-blind safe.
export const SAFETY_STOPS: Array<[number, string]> = [
  [0, "#d73027"],
  [25, "#fc8d59"],
  [50, "#fee08b"],
  [75, "#91cf60"],
  [100, "#1a9850"],
];

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
