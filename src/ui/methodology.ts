const DECISION_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/METRIC_DECISION.md";

const REPO_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/SAFETY_METHODOLOGY.md";

const CONTENT = `
  <h2>Skąd te dane?</h2>
  <p>Mapa pokazuje <strong>wyłącznie dane o bezpieczeństwie</strong>. Każdy obszar
     jest pokolorowany statystyką mierzoną <strong>na jego poziomie</strong> —
     bo przestępczości w podziale na dzielnice nikt nie publikuje.</p>

  <h3>Dzielnice Bilbao — percepcja bezpieczeństwa (0–10)</h3>
  <p><em>Estudio de Percepción de Seguridad y Victimización 2025</em>, Ratusz Bilbao,
     badanie Ikerfel: <strong>8580 wywiadów telefonicznych</strong>, osoby 16+,
     praca terenowa III–XII 2025.</p>
  <ul>
    <li>Jedyny pomiar bezpieczeństwa robiony <strong>per dzielnica</strong> —
        i dosłowna odpowiedź na pytanie „czy da się tu bezpiecznie chodzić",
        bo mieszkańcy oceniają własną dzielnicę.</li>
    <li>Deusto 5,83 · Uribarri 5,79 · Otxarkoaga-Txurdinaga 5,66 · Errekalde 5,56 ·
        Basurtu-Zorrotza 5,50 · Ibaiondo 5,48 · Begoña 5,47 · Abando 5,44.</li>
    <li>Miasto ogółem 5,58; <strong>nocą 5,24</strong>.</li>
  </ul>

  <h3>Ofiary przestępstw — Bilbao 2025</h3>
  <p>Z tego samego badania, odsetek mieszkańców, którzy padli ofiarą
     (w nawiasie 2024):</p>
  <ul>
    <li>Kradzież <strong>9,3 %</strong> (9,2 %)</li>
    <li>Rozbój z przemocą <strong>2,5 %</strong> (2,7 %)</li>
    <li>Napaść na tle seksualnym <strong>2,5 %</strong> (3,2 %)</li>
    <li>Zniszczenie mienia <strong>8,1 %</strong> (9,8 %)</li>
    <li>Oszustwo, głównie online <strong>53 %</strong></li>
  </ul>
  <p>Publikowane zbiorczo dla całego miasta — badanie nie rozbija ich na dzielnice.</p>

  <h3>Gminy sąsiednie — przestępstwa na 1000 mieszkańców</h3>
  <p><em>Udalmap</em>, Rząd Kraju Basków, rok 2024. Odniesienie: Bizkaia 49,6‰.</p>
  <ul>
    <li>Zamudio 74,8 · Erandio 60,1 · Barakaldo 52,2 · Alonsotegi 50,6 ·
        Sondika 48,2 · Basauri 46,7 · Arrigorriaga 37,3 · Etxebarri 28,7.
        Bilbao jako gmina: 66,6.</li>
    <li>To przestępstwa <strong>zgłoszone</strong>, dzielone przez liczbę
        mieszkańców. Gminy z dużym ruchem przyjezdnych — Zamudio ma park
        technologiczny, Sondika lotnisko — mają wskaźnik zawyżony.</li>
  </ul>

  <h3>Dlaczego dwie miary</h3>
  <p>Bo trzeciej możliwości nie ma. Jedna miara wszędzie oznacza przestępczość per
     gmina, czyli <strong>Bilbao jako jedną plamę</strong>. Jedna miara per dzielnica
     istnieje tylko w Bilbao, więc sąsiedzi zostaliby bez danych. Skale są
     <strong>rozdzielne</strong>, każda z własną legendą, a każdy obszar nosi na mapie
     swoją liczbę z jednostką — ten sam zielony nigdy nie znaczy dwóch rzeczy.</p>

  <p>Pełne uzasadnienie:
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
