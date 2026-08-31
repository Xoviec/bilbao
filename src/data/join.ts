import type { SafetyMap } from "./loader";

/**
 * Czysta funkcja: dołącza metryki bezpieczeństwa do właściwości featerów
 * dzielnic (join po polu `code`). Zwraca nową kolekcję (bez mutacji wejścia).
 * Wydzielona z loadera, aby była testowalna bez sieci.
 */
export function joinSafety(
  districts: GeoJSON.FeatureCollection,
  safety: SafetyMap,
): GeoJSON.FeatureCollection {
  return {
    ...districts,
    features: districts.features.map((f) => {
      const code = f.properties?.code as string | undefined;
      const rec = code ? safety[code] : undefined;
      return {
        ...f,
        properties: {
          ...f.properties,
          safety_index: rec?.safety_index ?? null,
          day_score: rec?.day_score ?? null,
          night_score: rec?.night_score ?? null,
          trend: rec?.trend ?? "flat",
        },
      };
    }),
  };
}
