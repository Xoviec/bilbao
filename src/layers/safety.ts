import { RAMP, METRICS, type MetricId, type Metric } from "../config";

export type SafetyField = MetricId;

/** Punkty skali (wartość → kolor) dla metryki, z uwzględnieniem kierunku. */
export function rampStops(metric: Metric): Array<[number, string]> {
  const [lo, hi] = metric.domain;
  // Dla metryk, gdzie wyżej = gorzej (przestępczość), paleta idzie odwrotnie.
  const colors = metric.higherIsBetter ? RAMP : [...RAMP].reverse();
  const step = (hi - lo) / (colors.length - 1);
  return colors.map((c, i) => [lo + step * i, c]);
}

/**
 * Wyrażenie MapLibre 'interpolate' dla wybranej metryki.
 * Obszary bez danych (null) dostają kolor neutralny — brak pomiaru nie jest
 * wynikiem i nie może wyglądać jak wynik.
 */
export function safetyFillColor(field: SafetyField = "perception"): unknown {
  const metric = METRICS[field];
  const stops = rampStops(metric).flatMap(([v, c]) => [v, c]);
  return [
    "case",
    ["==", ["get", metric.field], null],
    "#cccccc",
    ["interpolate", ["linear"], ["get", metric.field], ...stops],
  ];
}
