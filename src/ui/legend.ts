import { CATEGORY_COLORS, CATEGORY_LABELS, METRICS, DEFAULT_METRIC } from "../config";
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
  const metric = METRICS[DEFAULT_METRIC];

  // Choropleth istnieje TYLKO dla przestępczości. Percepcja ma rozpiętość
  // 0,39 pkt na skali 0–10 — gradient udawałby różnicę, której nie ma, więc
  // pokazujemy ją jako liczby na dzielnicach i mówimy o tym wprost.
  // Obie metryki mają teraz gradient, ale o RÓŻNYM znaczeniu: przestępczość to
  // skala bezwzględna, percepcja — odchylenie od średniej miasta. Legenda musi
  // rozróżnić te dwa przypadki, inaczej ten sam zielony znaczy raz co innego.
  const stops = rampStops(metric);
  const [lo, hi] = metric.domain;
  const gradient = stops
    .map(([v, c]) => `${c} ${(((v - lo) / (hi - lo)) * 100).toFixed(0)}%`)
    .join(", ");
  const [loLabel, hiLabel] = metric.ends ?? ["", ""];

  const scaleHtml = `
    <div class="legend-bar" style="background: linear-gradient(90deg, ${gradient});"></div>
    <div class="legend-scale">
      <span>${loLabel}</span>
      <span>${lo}–${hi}${metric.unit}</span>
      <span>${hiLabel}</span>
    </div>
    <p class="legend-note">Jeden wskaźnik na jednej jednostce — <strong>gminie</strong>,
       bo tylko na tym poziomie ta statystyka jest mierzona. Dziewięć obszarów,
       dziewięć niezależnych pomiarów.</p>
  `;

  const catRows = categories
    .map(
      (c) => `<div class="legend-cat">
        <span class="dot" style="background:${CATEGORY_COLORS[c] ?? "#666"}"></span>
        <span>${CATEGORY_LABELS[c] ?? c}</span>
      </div>`,
    )
    .join("");

  const missingRow =
    notes.missing
      ? `<div class="legend-cat legend-missing">
           <span class="dot" style="background:#cccccc"></span>
           <span>Brak danych (${notes.missing} z ${notes.total})</span>
         </div>`
      : "";

  container.innerHTML = `
    <div class="legend-title">${metric.label}</div>
    ${scaleHtml}
    ${missingRow}
    <button id="methodology-btn" class="link-btn" type="button">ⓘ Skąd te dane?</button>
    ${catRows ? `<div class="legend-title legend-sep">Kategorie miejsc</div>${catRows}` : ""}
  `;
}
