import type { SafetyMap, SourceRef, Reference, CityWide } from "../data/loader";
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

const fmt = (n: number | null, digits = 2): string =>
  n == null ? "—" : n.toFixed(digits).replace(".", ",");

/** Renderuje panel szczegółów wybranego obszaru (metryki + miejsca). */
export function showDistrict(
  sidebar: HTMLElement,
  code: string,
  name: string,
  safety: SafetyMap,
  places: PlaceItem[] = [],
  sources: Record<string, SourceRef> = {},
  reference: Reference | null = null,
  cityWide: Record<string, CityWide> = {},
): void {
  const rec = safety[code];
  // Percepcja nocna jest publikowana tylko zbiorczo dla miasta, nie per dzielnica.
  // To jedyne miejsce, gdzie da się ją uczciwie pokazać — jako kontekst, nie
  // jako wartość tej dzielnicy.
  const city = cityWide[code.split("-")[0]];
  sidebar.classList.remove("hidden");

  const blocks: string[] = [];

  if (rec?.perception != null) {
    // Trend percepcji: "up" = ocena wyższa niż rok wcześniej, czyli lepiej.
    const src = rec.perception_source ? sources[rec.perception_source] : undefined;
    blocks.push(`
      <div class="metric">
        <div class="metric-head">
          <span class="metric-label">Percepcja bezpieczeństwa</span>
          <span class="metric-value">${fmt(rec.perception)}<small>/10</small>
            ${TREND_ICON[rec.perception_trend] ?? ""}</span>
        </div>
        <p class="metric-meta">Badanie ankietowe ${rec.perception_year ?? ""} ·
          rok wcześniej ${fmt(rec.perception_prev)}${
            city ? ` · miasto ogółem ${fmt(city.perception)}, nocą ${fmt(city.perceptionNight)}` : ""
          }</p>
        ${src ? `<p class="metric-src">${esc(src.publisher)}</p>` : ""}
      </div>`);
  }

  if (rec?.crime_rate != null) {
    const src = rec.crime_source ? sources[rec.crime_source] : undefined;
    const pct = rec.crime_change_pct;
    const pctTxt = pct == null ? "" : `${pct > 0 ? "+" : ""}${fmt(pct, 1)}% r/r`;
    // Przy przestępczości "up" znaczy WIĘCEJ przestępstw — czyli gorzej.
    blocks.push(`
      <div class="metric">
        <div class="metric-head">
          <span class="metric-label">Przestępstwa / 1000 mieszk.</span>
          <span class="metric-value">${fmt(rec.crime_rate, 1)}
            ${TREND_ICON[rec.crime_trend] ?? ""}</span>
        </div>
        <p class="metric-meta">${esc(rec.crime_period ?? "")} ${pctTxt ? `· ${pctTxt}` : ""}${
          reference ? ` · ${esc(reference.name)}: ${fmt(reference.rate, 1)}` : ""
        }</p>
        ${src ? `<p class="metric-src">${esc(src.publisher)}</p>` : ""}
      </div>`);
  }

  // Dzielnica NIE ma własnej stopy przestępczości — nikt jej nie publikuje w tym
  // podziale. Pokazujemy wartość gminy jako kontekst, wyraźnie oddzielony od
  // metryk tego obszaru, zamiast powtarzać tę samą liczbę na ośmiu dzielnicach.
  // BEZ LICZBY. Powtórzenie tej samej stopy gminnej na ośmiu dzielnicach było
  // dokładnie tym, co czytało się jak zepsute dane. Kierujemy do trybu, w którym
  // ta metryka ma swoją właściwą jednostkę i pada dokładnie raz.
  const contextHtml =
    rec?.city_crime_rate != null
      ? `<p class="metric-context">Przestępczość mierzona jest dla
           <strong>całej gminy ${esc(rec.city_name ?? "")}</strong>, nie dla dzielnic —
           nikt nie publikuje jej w tym rozbiciu. Zobacz ją w trybie
           <strong>Przestępczość</strong>.</p>`
      : "";

  const safetyHtml = blocks.length
    ? blocks.join("")
    : `<p class="muted">Brak danych o bezpieczeństwie dla tego obszaru.
         ${esc(rec?.no_data_reason ?? "")}</p>`;

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

  const sourceHtml = blocks.length
    ? `<p class="source muted">Miejsca i granice: OpenStreetMap</p>`
    : `<p class="source muted">Brak wskaźników dla tego obszaru · miejsca i granice: OpenStreetMap</p>`;

  sidebar.innerHTML = `
    <button class="close" aria-label="Zamknij">×</button>
    <h2 tabindex="-1">${esc(name)}</h2>
    ${safetyHtml}
    ${contextHtml}
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
