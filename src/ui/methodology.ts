const REPO_DOC =
  "https://github.com/Xoviec/bilbao/blob/main/docs/SAFETY_METHODOLOGY.md";

const CONTENT = `
  <h2>Skąd te dane?</h2>
  <p>Mapa pokazuje <strong>dwie niezależne metryki</strong>. Celowo nie są zlane
     w jeden „indeks bezpieczeństwa" — mierzą co innego, pochodzą z innych źródeł
     i obejmują inny obszar. Zważenie ich w jedną liczbę wyglądałoby precyzyjnie,
     a byłoby wymysłem.</p>

  <h3>1. Percepcja bezpieczeństwa (0–10)</h3>
  <p><em>Estudio de Percepción de Seguridad y Victimización 2025</em>, Ratusz Bilbao,
     badanie wykonane przez Ikerfel: <strong>8580 wywiadów telefonicznych</strong>
     z osobami 16+, praca terenowa marzec–grudzień 2025.</p>
  <ul>
    <li>Dostępne dla <strong>8 dzielnic Bilbao</strong>. Pozostałe gminy nie prowadzą takiego badania.</li>
    <li>Całe miasto: <strong>5,58</strong>; nocą <strong>5,24</strong>
        (percepcja nocna publikowana jest tylko zbiorczo, nie per dzielnica —
        dlatego nie ma trybu „noc").</li>
    <li>Rozpiętość między dzielnicami to <strong>0,39 pkt</strong> (5,44–5,83).
        Skala kolorów jest stała, żeby tej różnicy nie wyolbrzymiać.</li>
    <li>To <strong>odczucie mieszkańców</strong>, nie pomiar przestępczości.</li>
  </ul>

  <h3>2. Przestępstwa na 1000 mieszkańców (‰)</h3>
  <p><em>Udalmap — Indicadores municipales de sostenibilidad: Índice de delitos</em>,
     Rząd Kraju Basków. Dane <strong>roczne za 2024</strong> (porównanie: 2023).</p>
  <ul>
    <li>Obejmuje <strong>wszystkie 251 gmin</strong> Kraju Basków — bez progu
        ludnościowego, więc także te najmniejsze jak Sondika czy Alonsotegi.</li>
    <li>Odniesienie: cała prowincja <strong>Bizkaia 49,6‰</strong>.</li>
    <li>Wartość dotyczy <strong>całej gminy</strong>. Dzielnice Bilbao dziedziczą
        liczbę miejską, bo rozbicia na dzielnice nikt nie publikuje — panel
        obszaru zaznacza to ostrzeżeniem.</li>
    <li>To przestępstwa <strong>zgłoszone</strong>. Wyższa zgłaszalność potrafi
        podnieść wskaźnik bez wzrostu realnej przestępczości. Gminy z dużym ruchem
        przyjezdnych (praca, zakupy, lotnisko) mają wskaźnik zawyżony, bo dzieli się
        zdarzenia przez samych mieszkańców.</li>
    <li>Rząd wielkości potwierdzony niezależnie danymi kwartalnymi Eustat/Ertzaintza
        (Bilbao 16,3‰ za I kw. 2026 ≈ 66,6‰ rocznie).</li>
  </ul>

  <p class="warn">⚠️ Szary kolor to <strong>brak pomiaru</strong>, nie „bezpiecznie".
     Nie wypełniamy go szacunkami.</p>

  <p>Zasady etyczne (neutralny język, unikanie stygmatyzacji) i pełny opis:
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
