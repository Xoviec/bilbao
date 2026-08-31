const REPO_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/SAFETY_METHODOLOGY.md";

const CONTENT = `
  <h2>Jak liczymy bezpieczeństwo?</h2>
  <p>Indeks <strong>0–100</strong> (100 = najbezpieczniej) to ważona kombinacja wskaźników,
     znormalizowanych między dzielnicami, aby były porównywalne.</p>
  <ul>
    <li><strong>Incydenty / 1000 mieszkańców</strong> — waga 50%</li>
    <li><strong>Pora doby</strong> (udział nocnych) — 15%</li>
    <li><strong>Ciężkość</strong> zdarzeń — 20%</li>
    <li><strong>Percepcja</strong> (ankiety, jeśli dostępne) — 15%</li>
  </ul>
  <p>Normalizacja min–max (z winsoryzacją), agregacja ważona, wynik skalowany do 0–100.
     <code>day_score</code>/<code>night_score</code> liczone analogicznie wg pory.</p>
  <p class="warn">⚠️ Obecne dane są <strong>szacunkowe (placeholder)</strong> i służą demonstracji.
     Docelowo: otwarte źródła (Open Data Euskadi / Eustat / miasto), z jawnym oznaczeniem źródła.</p>
  <p>Pełna metodologia i zasady etyczne (neutralny język, unikanie stygmatyzacji):
     <a href="${REPO_DOC}" target="_blank" rel="noopener">SAFETY_METHODOLOGY.md ↗</a></p>
`;

/** Otwiera modal z metodologią indeksu bezpieczeństwa. */
export function openMethodology(): void {
  if (document.getElementById("methodology-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "methodology-modal";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Metodologia wskaźnika bezpieczeństwa");
  overlay.innerHTML = `
    <div class="modal">
      <button class="close" aria-label="Zamknij">×</button>
      ${CONTENT}
    </div>`;

  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector(".close")?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  document.getElementById("app")?.appendChild(overlay);
  (overlay.querySelector(".close") as HTMLElement)?.focus();
}
