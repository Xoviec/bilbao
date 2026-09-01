import { CATEGORY_COLORS, CATEGORY_LABELS, METRICS, type MetricId } from "../config";
import { rampStops } from "../layers/safety";

export interface LegendNotes {
  /** Ile obszarów nie ma danych dla AKTYWNEJ metryki (rysowane na szaro). */
  missing: number;
  total: number;
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
  // DWIE skale, bo dwie metryki mierzone na różnych poziomach. Każda ma własny
  // pasek, jednostkę i kierunek — ten sam zielony nigdy nie znaczy dwóch rzeczy.
  const scale = (id: MetricId) => {
    const m = METRICS[id];
    const [lo, hi] = m.domain;
    const gradient = rampStops(m)
      .map(([v, c]) => `${c} ${(((v - lo) / (hi - lo)) * 100).toFixed(0)}%`)
      .join(", ");
    return `
      <div class="legend-title legend-sub">${m.label} <small>· per ${m.level}</small></div>
      <div class="legend-bar" style="background: linear-gradient(90deg, ${gradient});"></div>
      <div class="legend-scale">
        <span>${m.ends[0]}</span>
        <span>${String(lo).replace(".", ",")}–${String(hi).replace(".", ",")}${m.unit}</span>
        <span>${m.ends[1]}</span>
      </div>`;
  };

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

  container.innerHTML = `
    <div class="legend-title">Bezpieczeństwo</div>
    ${scale("perception")}
    ${scale("crime_rate")}
    <p class="legend-note">Każdy obszar pokazuje statystykę mierzoną na JEGO
       poziomie i nosi swoją liczbę z jednostką. Przestępczości w podziale na
       dzielnice nikt nie publikuje — dlatego dzielnice Bilbao mają percepcję.</p>
    ${missingRow}
    <button id="methodology-btn" class="link-btn" type="button">ⓘ Skąd te dane?</button>
    ${catRows ? `<div class="legend-title legend-sep">Kategorie miejsc</div>${catRows}` : ""}
  `;
}
