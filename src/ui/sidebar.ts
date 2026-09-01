import type { Reference, CityWide, Victimisation } from "../data/loader";
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

export interface AreaView {
  name: string;
  /** Dzielnica Bilbao (percepcja) czy gmina sąsiednia (przestępczość). */
  isDistrict: boolean;
  perception: number | null;
  perceptionPrev: number | null;
  crimeRate: number | null;
  crimePrev: number | null;
  crimeChangePct: number | null;
  crimePeriod: string | null;
  cityName: string;
  /** Stopa gminy, w której leży dzielnica — kontekst, nie jej własny pomiar. */
  cityCrimeRate: number | null;
}

const trendOf = (now: number | null, prev: number | null, higherBetter: boolean) => {
  if (now == null || prev == null || now === prev) return "flat";
  return (higherBetter ? now > prev : now < prev) ? "up" : "down";
};

/**
 * Panel obszaru. Metryka mierzona NA JEGO POZIOMIE jest główna, reszta danych
 * o bezpieczeństwie idzie jako jawnie podpisany kontekst.
 */
export function showArea(
  sidebar: HTMLElement,
  view: AreaView,
  places: PlaceItem[] = [],
  reference: Reference | null = null,
  victimisation: Victimisation | null = null,
  cityWide: CityWide | null = null,
): void {
  sidebar.classList.remove("hidden");

  const main = view.isDistrict
    ? `<div class="metric">
         <div class="metric-head">
           <span class="metric-label">Percepcja bezpieczeństwa</span>
           <span class="metric-value">${fmt(view.perception)}<small>/10</small>
             ${TREND_ICON[trendOf(view.perception, view.perceptionPrev, true)]}</span>
         </div>
         <p class="metric-meta">Ankieta mieszkańców 2025 · rok wcześniej
            ${fmt(view.perceptionPrev)}${
              cityWide
                ? ` · miasto ogółem ${fmt(cityWide.perception)}, nocą ${fmt(cityWide.perceptionNight)}`
                : ""
            }</p>
         <p class="metric-src">Ratusz Bilbao / Ikerfel · 8580 wywiadów · pomiar per dzielnica</p>
       </div>`
    : `<div class="metric">
         <div class="metric-head">
           <span class="metric-label">Przestępstwa / 1000 mieszk.</span>
           <span class="metric-value">${fmt(view.crimeRate, 1)}
             ${TREND_ICON[trendOf(view.crimeRate, view.crimePrev, false)]}</span>
         </div>
         <p class="metric-meta">${esc(view.crimePeriod ?? "")}${
           view.crimeChangePct == null
             ? ""
             : ` · ${view.crimeChangePct > 0 ? "+" : ""}${fmt(view.crimeChangePct, 1)}% r/r`
         }${reference ? ` · ${esc(reference.name)}: ${fmt(reference.rate, 1)}‰` : ""}</p>
         <p class="metric-src">Udalmap (Rząd Kraju Basków) · pomiar per gmina</p>
       </div>`;

  // Dzielnica nie ma własnej stopy przestępczości — nikt jej w tym rozbiciu nie
  // publikuje. Stopa gminy stoi obok, podpisana nazwą gminy.
  const cityCrime =
    view.isDistrict && view.cityCrimeRate != null
      ? `<p class="metric-context">Przestępczość mierzona jest dla całej gminy
           <strong>${esc(view.cityName)}</strong>: ${fmt(view.cityCrimeRate, 1)}‰
           (2024)${reference ? ` · ${esc(reference.name)}: ${fmt(reference.rate, 1)}‰` : ""}.
           W podziale na dzielnice nikt jej nie publikuje.</p>`
      : "";

  // Twarde statystyki „ilu ludzi padło ofiarą czego".
  const victims =
    victimisation && victimisation.items.length
      ? `<div class="extra">
           <h3 class="extra-title">Ofiary przestępstw — Bilbao ${victimisation._year}</h3>
           <p class="extra-note">Odsetek mieszkańców, którzy padli ofiarą (w nawiasie
              ${victimisation._prevYear}). ${esc(victimisation._scope)}</p>
           <ul class="perc-list">
             ${victimisation.items
               .map(
                 (v) => `<li><span>${esc(v.label)}</span><strong>${fmt(v.value, 1)}%${
                   v.prev == null ? "" : ` <small>(${fmt(v.prev, 1)}%)</small>`
                 }</strong></li>`,
               )
               .join("")}
           </ul>
         </div>`
      : "";

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

  sidebar.innerHTML = `
    <button class="close" aria-label="Zamknij">×</button>
    <h2 tabindex="-1">${esc(view.name)}</h2>
    ${main}
    ${cityCrime}
    ${victims}
    ${placesHtml}
    <p class="source muted">Granice i miejsca: OpenStreetMap</p>
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
  (sidebar.querySelector("h2") as HTMLElement)?.focus();
}
