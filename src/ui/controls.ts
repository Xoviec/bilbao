export interface DistrictOption {
  code: string;
  name: string;
}

/**
 * Wyszukiwarka obszaru. Bez przełącznika metryki — mapa ma jeden wskaźnik na
 * jednej jednostce (patrz docs/METRIC_DECISION.md), więc nie ma czym przełączać.
 */
export function renderControls(
  container: HTMLElement,
  districts: DistrictOption[],
  onSearch: (code: string) => void,
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
  `;

  const select = container.querySelector("#district-search") as HTMLSelectElement;
  select.addEventListener("change", () => {
    if (select.value) onSearch(select.value);
  });
}
