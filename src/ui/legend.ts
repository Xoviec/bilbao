import { SAFETY_STOPS } from "../config";

/** Renderuje legendę choroplethu bezpieczeństwa (gradient 0–100). */
export function renderLegend(container: HTMLElement): void {
  const gradient = SAFETY_STOPS.map(([v, c]) => `${c} ${v}%`).join(", ");
  container.innerHTML = `
    <div class="legend-title">Wskaźnik bezpieczeństwa</div>
    <div class="legend-bar" style="background: linear-gradient(90deg, ${gradient});"></div>
    <div class="legend-scale"><span>0 · niższe</span><span>100 · wyższe</span></div>
  `;
}
