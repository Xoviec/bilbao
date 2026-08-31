import { SAFETY_STOPS } from "../config";

/**
 * Buduje wyrażenie MapLibre 'interpolate' dla choroplethu bezpieczeństwa.
 * Dzielnice bez danych (null) dostają kolor neutralny.
 */
export function safetyFillColor(): unknown {
  const stops = SAFETY_STOPS.flatMap(([value, color]) => [value, color]);
  return [
    "case",
    ["==", ["get", "safety_index"], null],
    "#cccccc",
    ["interpolate", ["linear"], ["get", "safety_index"], ...stops],
  ];
}
