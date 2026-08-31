export interface FilterItem {
  id: string;
  label: string;
  color?: string;
  checked: boolean;
}

/**
 * Renderuje panel przełączników warstw. Wywołuje onToggle(id, visible)
 * przy każdej zmianie.
 */
export function renderFilters(
  container: HTMLElement,
  items: FilterItem[],
  onToggle: (id: string, visible: boolean) => void,
): void {
  container.innerHTML = `<div class="filters-title">Warstwy</div>`;
  for (const item of items) {
    const row = document.createElement("label");
    row.className = "filter-row";
    const dot = item.color
      ? `<span class="dot" style="background:${item.color}"></span>`
      : "";
    row.innerHTML = `
      <input type="checkbox" ${item.checked ? "checked" : ""} />
      ${dot}<span>${item.label}</span>`;
    const input = row.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", () => onToggle(item.id, input.checked));
    container.appendChild(row);
  }
}
