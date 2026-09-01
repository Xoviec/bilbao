const DECISION_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/METRIC_DECISION.md";

const REPO_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/SAFETY_METHODOLOGY.md";

const CONTENT = `
  <h2>Skąd te dane?</h2>
  <p>Mapa pokazuje <strong>jeden wskaźnik na jednej jednostce</strong>: dochód
     netto na osobę, per <strong>dystrykt INE</strong>. Bilbao dzieli się na
     8 dzielnic, sąsiednie gminy na swoje dystrykty — razem 31 obszarów,
     31 niezależnych pomiarów.</p>

  <p class="warn">⚠️ To wskaźnik <strong>dochodowy, nie pomiar przestępczości</strong>.
     Wybrany dlatego, że jest jedyną statystyką publikowaną w tej samej jednostce
     dla Bilbao i wszystkich sąsiadów. Dane o bezpieczeństwie znajdziesz w panelu
     każdego obszaru.</p>

  <h3>Miernik mapy</h3>
  <p><em>Atlas de Distribución de Renta de los Hogares</em> (INE), rok 2023.
     Źródło: deklaracje podatkowe IRPF (AEAT i skarby baskijski/nawarski).</p>
  <ul>
    <li>Publikowany dla <strong>każdej gminy, dystryktu i sekcji censalnej</strong>
        w Hiszpanii — stąd wspólna jednostka dla całej aglomeracji.</li>
    <li>Zakres na mapie: <strong>15 034 – 30 762 €</strong>. Wewnątrz Bilbao od
        Otxarkoaga-Txurdinaga (15 771 €) po Abando (30 762 €).</li>
  </ul>

  <h3>Bezpieczeństwo — w panelu obszaru</h3>
  <ul>
    <li><strong>Przestępstwa na 1000 mieszkańców</strong> (Udalmap, 2024) —
        mierzone <em>per gmina</em>, więc podpisane nazwą gminy, nie dystryktu.
        Odniesienie: Bizkaia 49,6‰.</li>
    <li><strong>Percepcja bezpieczeństwa</strong> (ankieta Ratusza Bilbao,
        Ikerfel 2025, 8580 wywiadów) — tylko dla ośmiu dzielnic Bilbao.</li>
  </ul>

  <h3>Dlaczego przestępczość nie jest miernikiem mapy</h3>
  <p><strong>Nikt nie publikuje jej poniżej poziomu gminy.</strong> Sprawdzone
     trzykrotnie: cały katalog Bilbao Open Data (341 zbiorów, zero statystyk),
     katalog krajowy (granulacja kończy się na gminie) oraz raport
     <em>Bilbao Hiri Segurua</em> (UPV/EHU, 2026), który miastu dopiero
     <strong>rekomenduje</strong> publikowanie takich danych. Użycie jej jako
     miernika mapy oznaczałoby jedną liczbę powtórzoną na ośmiu dzielnicach.</p>

  <p>Pełne uzasadnienie wyboru:
     <a href="${DECISION_DOC}" target="_blank" rel="noopener">METRIC_DECISION.md ↗</a> ·
     zasady etyczne:
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
