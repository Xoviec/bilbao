import type { SafetyMap } from "../data/loader";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../config";

const TREND_ICON: Record<string, string> = { up: "▲", flat: "▬", down: "▼" };

export interface PlaceItem {
  name: string;
  category: string;
}

/** Escape tekstu wstawianego do innerHTML (dane mogą pochodzić z OSM). */
function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Renderuje panel szczegółów wybranej dzielnicy (metryki + miejsca). */
export function showDistrict(
  sidebar: HTMLElement,
  code: string,
  name: string,
  safety: SafetyMap,
  places: PlaceItem[] = [],
): void {
  const rec = safety[code];
  sidebar.classList.remove("hidden");

  // Rekord z samymi nullami (gmina bez statystyk) to nadal BRAK danych — bez tego
  // panel rysowałby pusty licznik "—/100", sugerujący, że pomiar istnieje.
  const safetyHtml = !rec || rec.safety_index == null
    ? `<p class="muted">Brak danych o bezpieczeństwie dla tego obszaru.</p>`
    : `
      <div class="score" style="--v:${rec.safety_index}">
        <span class="score-num">${rec.safety_index ?? "—"}</span>
        <span class="score-label">/100 bezpieczeństwo ${TREND_ICON[rec.trend] ?? ""}</span>
      </div>
      <ul class="metrics">
        <li><span>Dzień</span><strong>${rec.day_score ?? "—"}</strong></li>
        <li><span>Noc</span><strong>${rec.night_score ?? "—"}</strong></li>
        <li><span>Incydenty / 1k</span><strong>${rec.incidents_per_1k ?? "—"}</strong></li>
      </ul>
      <p class="summary">${esc(rec.summary)}</p>`;

  const placesHtml = places.length
    ? `<h3 class="places-title">Miejsca w tym obszarze (${places.length})</h3>
       <ul class="places-list">
         ${places
           .map(
             (p) => `<li>
               <span class="dot" style="background:${CATEGORY_COLORS[p.category] ?? "#666"}"></span>
               <span class="place-name">${esc(p.name)}</span>
               <span class="place-cat">${esc(CATEGORY_LABELS[p.category] ?? p.category)}</span>
             </li>`,
           )
           .join("")}
       </ul>`
    : `<p class="muted">Brak miejsc w danych dla tego obszaru.</p>`;

  // Stopka opisuje stan TEGO obszaru. "Dane szacunkowe" przy obszarze bez
  // żadnych wskaźników byłoby nieprawdą — tam nie ma czego szacować.
  const hasSafety = Boolean(rec && rec.safety_index != null);
  const sourceHtml = hasSafety
    ? `<p class="source muted">Wskaźniki szacunkowe · miejsca i granice: OpenStreetMap</p>`
    : `<p class="source muted">Brak wskaźników dla tego obszaru · miejsca i granice: OpenStreetMap</p>`;

  sidebar.innerHTML = `
    <button class="close" aria-label="Zamknij">×</button>
    <h2 tabindex="-1">${esc(name)}</h2>
    ${safetyHtml}
    ${placesHtml}
    ${sourceHtml}
  `;

  const close = () => {
    sidebar.classList.add("hidden");
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  sidebar.querySelector(".close")?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  // Focus na nagłówku — czytniki ekranu ogłoszą otwarty panel.
  (sidebar.querySelector("h2") as HTMLElement)?.focus();
}
