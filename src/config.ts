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
