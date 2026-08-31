import { SAFETY_STOPS, CATEGORY_COLORS, CATEGORY_LABELS } from "../config";

/**
 * Renderuje legendę: gradient bezpieczeństwa (0–100) oraz kategorie miejsc.
 * `categories` ogranicza listę do kategorii faktycznie obecnych w danych.
 */
export function renderLegend(container: HTMLElement, categories: string[]): void {
  const gradient = SAFETY_STOPS.map(([v, c]) => `${c} ${v}%`).join(", ");

  const catRows = categories
    .map(
      (c) => `<div class="legend-cat">
        <span class="dot" style="background:${CATEGORY_COLORS[c] ?? "#666"}"></span>
        <span>${CATEGORY_LABELS[c] ?? c}</span>
      </div>`,
    )
    .join("");

  container.innerHTML = `
    <div class="legend-title">Wskaźnik bezpieczeństwa</div>
    <div class="legend-bar" style="background: linear-gradient(90deg, ${gradient});"></div>
    <div class="legend-scale"><span>0 · niższe</span><span>100 · wyższe</span></div>
    <button id="methodology-btn" class="link-btn" type="button">ⓘ Jak to liczymy?</button>
    ${catRows ? `<div class="legend-title legend-sep">Kategorie miejsc</div>${catRows}` : ""}
  `;
}
