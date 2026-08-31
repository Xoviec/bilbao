import { SAFETY_STOPS } from "../config";

export type SafetyField = "safety_index" | "day_score" | "night_score";

/**
 * Buduje wyrażenie MapLibre 'interpolate' dla choroplethu bezpieczeństwa
 * na wskazanym polu (ogólny wskaźnik / dzień / noc).
 * Dzielnice bez danych (null) dostają kolor neutralny.
 */
export function safetyFillColor(field: SafetyField = "safety_index"): unknown {
  const stops = SAFETY_STOPS.flatMap(([value, color]) => [value, color]);
  return [
    "case",
    ["==", ["get", field], null],
    "#cccccc",
    ["interpolate", ["linear"], ["get", field], ...stops],
  ];
}
