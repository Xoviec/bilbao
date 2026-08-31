import type { SafetyMap } from "./loader";

/**
 * Czysta funkcja: dołącza metryki bezpieczeństwa do właściwości featerów
 * obszarów (join po polu `code`). Zwraca nową kolekcję (bez mutacji wejścia).
 * Wydzielona z loadera, aby była testowalna bez sieci.
 *
 * Brak rekordu i brak pomiaru dają tę samą wartość `null` — warstwa mapy
 * maluje wtedy obszar na szaro. Zera nie wstawiamy: "0 przestępstw" i "nie
 * wiemy" to dwie różne rzeczy.
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
          perception: rec?.perception ?? null,
          perception_trend: rec?.perception_trend ?? "flat",
          crime_rate: rec?.crime_rate ?? null,
          crime_trend: rec?.crime_trend ?? "flat",
          crime_scope: rec?.crime_scope ?? null,
        },
      };
    }),
  };
}
