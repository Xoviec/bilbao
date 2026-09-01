import { CATEGORY_COLORS, CATEGORY_LABELS, METRICS, type MetricId } from "../config";
import { rampStops } from "../layers/safety";

export interface LegendNotes {
  /** Ile obszarów nie ma danych dla AKTYWNEJ metryki (rysowane na szaro). */
  missing: number;
  total: number;
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
      ${metric.center != null
        ? `<span>śr. ${String(metric.center).replace(".", ",")}</span>`
        : `<span>${lo}–${hi}${metric.unit}</span>`}
      <span>${hiLabel}</span>
    </div>
    ${metric.caveat ? `<p class="legend-note legend-caveat">⚠ ${metric.caveat}</p>` : ""}
    ${notes.metric === "crime_rate"
      ? `<p class="legend-note">Kolor na poziomie <strong>gminy</strong> — tam ta
           statystyka jest mierzona. Granice dzielnic Bilbao są przerywane, bo nie
           mają własnej wartości.</p>`
      : `<p class="legend-note">Kolor na poziomie <strong>dzielnicy</strong>.
           Badana wyłącznie w Bilbao — pozostałe gminy pozostają szare.</p>`}
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
           <span>${notes.metric === "perception" ? "Nie badano" : "Brak danych"} (${notes.missing} z ${notes.total})</span>
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
