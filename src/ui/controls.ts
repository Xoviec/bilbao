import type { SafetyField } from "../layers/safety";

export interface DistrictOption {
  code: string;
  name: string;
}

export interface ControlHandlers {
  onSearch: (code: string) => void;
  onModeChange: (field: SafetyField) => void;
}

const MODES: Array<{ field: SafetyField; label: string }> = [
  { field: "safety_index", label: "Ogólny" },
  { field: "day_score", label: "Dzień" },
  { field: "night_score", label: "Noc" },
];

/** Renderuje wyszukiwarkę dzielnicy oraz przełącznik trybu (ogólny/dzień/noc). */
export function renderControls(
  container: HTMLElement,
  districts: DistrictOption[],
  handlers: ControlHandlers,
): void {
  const options = districts
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
    .map((d) => `<option value="${d.code}">${d.name}</option>`)
    .join("");

  container.innerHTML = `
    <label class="ctrl-search">
      <span class="sr-only">Szukaj dzielnicy</span>
      <select id="district-search" aria-label="Szukaj dzielnicy">
        <option value="">🔍 Wybierz dzielnicę…</option>
        ${options}
      </select>
    </label>
    <div class="ctrl-modes" role="group" aria-label="Tryb wskaźnika bezpieczeństwa">
      ${MODES.map(
        (m, i) =>
          `<button type="button" class="mode-btn${i === 0 ? " active" : ""}" data-field="${m.field}" aria-pressed="${i === 0}">${m.label}</button>`,
      ).join("")}
    </div>
  `;

  const select = container.querySelector("#district-search") as HTMLSelectElement;
  select.addEventListener("change", () => {
    if (select.value) handlers.onSearch(select.value);
  });

  const buttons = Array.from(container.querySelectorAll(".mode-btn")) as HTMLButtonElement[];
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      handlers.onModeChange(btn.dataset.field as SafetyField);
    });
  }
}
