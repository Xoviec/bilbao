import { METRICS, DEFAULT_METRIC, type MetricId } from "../config";
import type { SafetyField } from "../layers/safety";

export interface DistrictOption {
  code: string;
  name: string;
}

export interface ControlHandlers {
  onSearch: (code: string) => void;
  onModeChange: (field: SafetyField) => void;
}

// Tryby odpowiadają metrykom, dla których ISTNIEJĄ realne dane. Nie ma tu
// "dzień/noc": percepcja nocna jest publikowana tylko dla całego Bilbao,
// więc nie da się z niej zrobić choroplethu per obszar.
const MODES: Array<{ field: MetricId; label: string; title: string }> = (
  Object.keys(METRICS) as MetricId[]
).map((id) => ({
  field: id,
  label: METRICS[id].short,
  title: `${METRICS[id].label} (${METRICS[id].unit})`,
}));

/** Renderuje wyszukiwarkę obszaru oraz przełącznik metryki. */
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
      <span class="sr-only">Szukaj obszaru</span>
      <select id="district-search" aria-label="Szukaj obszaru">
        <option value="">🔍 Wybierz obszar…</option>
        ${options}
      </select>
    </label>
    <div class="ctrl-modes" role="group" aria-label="Wybór metryki">
      ${MODES.map(
        (m) =>
          `<button type="button" class="mode-btn${m.field === DEFAULT_METRIC ? " active" : ""}" data-field="${m.field}" title="${m.title}" aria-pressed="${m.field === DEFAULT_METRIC}">${m.label}</button>`,
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
