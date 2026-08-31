import type { SafetyMap } from "../data/loader";

const TREND_ICON: Record<string, string> = { up: "▲", flat: "▬", down: "▼" };

/** Renderuje panel szczegółów wybranej dzielnicy. */
export function showDistrict(
  sidebar: HTMLElement,
  code: string,
  name: string,
  safety: SafetyMap,
): void {
  const rec = safety[code];
  sidebar.classList.remove("hidden");

  if (!rec) {
    sidebar.innerHTML = `<button class="close" aria-label="Zamknij">×</button>
      <h2>${name}</h2><p class="muted">Brak danych o bezpieczeństwie.</p>`;
  } else {
    sidebar.innerHTML = `
      <button class="close" aria-label="Zamknij">×</button>
      <h2>${name}</h2>
      <div class="score" style="--v:${rec.safety_index}">
        <span class="score-num">${rec.safety_index}</span>
        <span class="score-label">/100 bezpieczeństwo ${TREND_ICON[rec.trend] ?? ""}</span>
      </div>
      <ul class="metrics">
        <li><span>Dzień</span><strong>${rec.day_score}</strong></li>
        <li><span>Noc</span><strong>${rec.night_score}</strong></li>
        <li><span>Incydenty / 1k</span><strong>${rec.incidents_per_1k}</strong></li>
      </ul>
      <p class="summary">${rec.summary}</p>
      <p class="source muted">Dane szacunkowe · źródło do podmiany (OSM / Open Data Euskadi)</p>
    `;
  }

  sidebar.querySelector(".close")?.addEventListener("click", () => {
    sidebar.classList.add("hidden");
  });
}
