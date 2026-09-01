const DECISION_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/METRIC_DECISION.md";

const REPO_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/SAFETY_METHODOLOGY.md";

const CONTENT = `
  <h2>Skąd te dane?</h2>
  <p>Mapa pokazuje <strong>jeden wskaźnik na jednej jednostce</strong>:
     przestępstwa na 1000 mieszkańców, per gmina. Dziewięć obszarów, dziewięć
     niezależnych pomiarów.</p>

  <h3>Miernik mapy</h3>
  <p><em>Udalmap — Indicadores municipales de sostenibilidad: Índice de delitos</em>,
     Rząd Kraju Basków. Dane <strong>roczne za 2024</strong> (porównanie: 2023).</p>
  <ul>
    <li>Obejmuje <strong>wszystkie 251 gmin</strong> Kraju Basków — bez progu
        ludnościowego, więc także najmniejsze jak Sondika czy Alonsotegi.</li>
    <li>Odniesienie: cała prowincja <strong>Bizkaia 49,6‰</strong>.</li>
    <li>To przestępstwa <strong>zgłoszone</strong>, dzielone przez liczbę
        <strong>mieszkańców</strong>. Gminy z dużym ruchem przyjezdnych — Zamudio
        ma park technologiczny, Sondika lotnisko — mają wskaźnik zawyżony, bo
        zdarzenia generują też osoby spoza gminy.</li>
    <li>Rząd wielkości potwierdzony niezależnie kwartalnymi danymi
        Eustat/Ertzaintza (Bilbao 16,3‰ za I kw. 2026 ≈ 66,6‰ rocznie).</li>
  </ul>

  <h3>Dlaczego nie ma podziału na dzielnice</h3>
  <p><strong>Nikt nie publikuje przestępczości poniżej poziomu gminy.</strong>
     Sprawdzone trzykrotnie: cały katalog Bilbao Open Data (341 zbiorów, zero
     statystyk), katalog krajowy (granulacja kończy się na gminie) oraz raport
     <em>Bilbao Hiri Segurua</em> (UPV/EHU, 2026), który miastu dopiero
     <strong>rekomenduje</strong> publikowanie takich danych.</p>
  <p>Dlatego mapa jest grubsza, ale spójna: każdy kolor znaczy wszędzie to samo.
     Wcześniej osiem dzielnic Bilbao dostawało tę samą liczbę miejską i wyglądało
     to jak zepsute dane.</p>

  <h3>Percepcja bezpieczeństwa — osobno</h3>
  <p>Ratusz Bilbao bada ją ankietowo (Ikerfel, 8580 wywiadów, 2025) i tylko
     w Bilbao, więc <strong>nie może być miernikiem mapy</strong>. Znajdziesz ją
     w panelu gminy Bilbao jako listę ośmiu dzielnic.</p>

  <p>Pełne uzasadnienie wyboru miernika:
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
