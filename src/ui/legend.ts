import { CATEGORY_COLORS, CATEGORY_LABELS, METRICS, type MetricId } from "../config";
import { rampStops } from "../layers/safety";

export interface LegendNotes {
  /** Ile obszarów nie ma danych dla AKTYWNEJ metryki (rysowane na szaro). */
  missing: number;
  total: number;
  /** Czy dane mieszają dzielnice z całymi gminami. */
  mixedResolution: boolean;
  /** Aktywna metryka. */
  metric: MetricId;
}

/**
 * Renderuje legendę: skalę aktywnej metryki oraz kategorie miejsc.
 *
 * Skala jest opisana JEDNOSTKĄ i kierunkiem, bo dwie metryki mają przeciwne
 * zwroty: przy percepcji wyżej = lepiej, przy przestępczości wyżej = gorzej.
 * Bez tego ten sam zielony kolor znaczyłby raz jedno, raz drugie.
 */
export function renderLegend(
  container: HTMLElement,
  categories: string[],
  notes: LegendNotes,
): void {
  const metric = METRICS[notes.metric];
  const stops = rampStops(metric);
  const [lo, hi] = metric.domain;
  const gradient = stops
    .map(([v, c]) => `${c} ${(((v - lo) / (hi - lo)) * 100).toFixed(0)}%`)
    .join(", ");

  const catRows = categories
    .map(
      (c) => `<div class="legend-cat">
        <span class="dot" style="background:${CATEGORY_COLORS[c] ?? "#666"}"></span>
        <span>${CATEGORY_LABELS[c] ?? c}</span>
      </div>`,
    )
    .join("");

  const missingRow = notes.missing
    ? `<div class="legend-cat legend-missing">
         <span class="dot" style="background:#cccccc"></span>
         <span>Brak danych (${notes.missing} z ${notes.total})</span>
       </div>`
    : "";

  const mixedNote = notes.mixedResolution
    ? `<p class="legend-note">Tylko Bilbao ma w OpenStreetMap podział na dzielnice;
       pozostałe gminy pokazane są w całości. Jednolity kolor gminy oznacza brak
       danych szczegółowych, a nie jednorodność terenu.</p>`
    : "";

  // Uczciwość skali: przy percepcji rozpiętość między dzielnicami Bilbao to
  // 0,39 pkt na skali 0–10. Skala jest stała, więc obszary wyglądają podobnie —
  // bo podobne są. Warto to powiedzieć, żeby nikt nie szukał różnic, których nie ma.
  const spreadNote =
    notes.metric === "perception"
      ? `<p class="legend-note">Różnice między dzielnicami Bilbao są minimalne
         (5,44–5,83). Skala jest stała, żeby ich sztucznie nie wyolbrzymiać.</p>`
      : "";

  container.innerHTML = `
    <div class="legend-title">${metric.label}</div>
    <div class="legend-bar" style="background: linear-gradient(90deg, ${gradient});"></div>
    <div class="legend-scale">
      <span>${lo}${metric.unit}</span>
      <span>${metric.higherIsBetter ? "wyżej = bezpieczniej" : "wyżej = gorzej"}</span>
      <span>${hi}${metric.unit}</span>
    </div>
    ${missingRow}
    ${spreadNote}
    ${mixedNote}
    <button id="methodology-btn" class="link-btn" type="button">ⓘ Skąd te dane?</button>
    ${catRows ? `<div class="legend-title legend-sep">Kategorie miejsc</div>${catRows}` : ""}
  `;
}
