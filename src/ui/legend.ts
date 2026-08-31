import { SAFETY_STOPS, CATEGORY_COLORS, CATEGORY_LABELS } from "../config";

export interface LegendNotes {
  /** Ile jednostek nie ma danych bezpieczeństwa (rysowane na szaro). */
  missing: number;
  /** Czy dane mieszają dzielnice z całymi gminami. */
  mixedResolution: boolean;
}

/**
 * Renderuje legendę: gradient bezpieczeństwa (0–100) oraz kategorie miejsc.
 * `categories` ogranicza listę do kategorii faktycznie obecnych w danych.
 *
 * `notes` opisuje ograniczenia zbioru. Szara plama i gmina pokazana jako jeden
 * obszar są artefaktami braku danych, nie stwierdzeniem o terenie — legenda musi
 * to powiedzieć wprost, inaczej mapa sugeruje wiedzę, której nie ma.
 */
export function renderLegend(
  container: HTMLElement,
  categories: string[],
  notes: LegendNotes = { missing: 0, mixedResolution: false },
): void {
  const gradient = SAFETY_STOPS.map(([v, c]) => `${c} ${v}%`).join(", ");

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
         <span>Brak danych (${notes.missing})</span>
       </div>`
    : "";

  const mixedNote = notes.mixedResolution
    ? `<p class="legend-note">Bilbao ma podział na dzielnice; pozostałe gminy pokazane
       są w całości, bo nie mają go w OpenStreetMap. Jednolity kolor gminy oznacza
       brak danych szczegółowych, a nie jednorodność terenu.</p>`
    : "";

  container.innerHTML = `
    <div class="legend-title">Wskaźnik bezpieczeństwa</div>
    <div class="legend-bar" style="background: linear-gradient(90deg, ${gradient});"></div>
    <div class="legend-scale"><span>0 · niższe</span><span>100 · wyższe</span></div>
    ${missingRow}
    ${mixedNote}
    <button id="methodology-btn" class="link-btn" type="button">ⓘ Jak to liczymy?</button>
    ${catRows ? `<div class="legend-title legend-sep">Kategorie miejsc</div>${catRows}` : ""}
  `;
}
