# Bilbao Safety Map 🗺️

Interaktywna mapa **Bilbao i 8 sąsiadujących gmin** oparta o **OpenStreetMap**,
wizualizująca **wskaźnik bezpieczeństwa**, **aktywności** oraz **miejsca warte zobaczenia**.

Lekki, szybki i w pełni statyczny front‑end (bez backendu w MVP) — zoptymalizowany pod
kątem wydajności renderowania i czytelności danych.

---

## ✨ Co pokazuje mapa

- **Choropleth dwóch metryk** — percepcja bezpieczeństwa albo przestępczość; szary = brak danych.
- **Przełącznik metryki** — skala i jej kierunek zmieniają się razem z danymi.
- **Aktywności** — sport, kultura, nocne życie, tereny zielone (ikony kategorii).
- **POI / miejsca warte zobaczenia** — atrakcje, punkty widokowe, zabytki (clustering).
- **Panel obszaru** — po kliknięciu: metryki bezpieczeństwa (lub jawne „brak danych"), miejsca.
- **Wyszukiwarka** — 16 obszarów z 9 gmin; dzielnice Bilbao poprzedzone nazwą gminy.
- **Tooltip na hover, filtry per kategoria, legenda** — pełna czytelność danych.
- **Tryb awaryjny basemapy** — fallback rastrowy, gdy dostawca kafli jest niedostępny.

## 🧱 Stack (lekki)

| Warstwa | Technologia | Dlaczego |
|---|---|---|
| Build / dev | **Vite** | Błyskawiczny dev‑server, mały bundle, tree‑shaking |
| Język | **TypeScript** | Bezpieczeństwo typów przy pracy z GeoJSON |
| Mapa | **MapLibre GL JS** | Open‑source, wektorowe kafle, GPU, brak tokenów/opłat |
| Basemap | **OpenFreeMap / Protomaps** | Darmowe kafle OSM bez klucza API |
| Dane | **GeoJSON + JSON** | Prosty, statyczny, cache‑owalny format |
| Hosting | **Static** (GitHub Pages / Netlify / Vercel) | Zero kosztów, globalny CDN |

> Brak ciężkich frameworków w MVP — vanilla TS + MapLibre. Reaktywność minimalna,
> całość ładuje się w kilkadziesiąt kB JS (poza silnikiem mapy).

## 🚀 Szybki start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produkcyjny build do dist/
npm run preview  # podgląd builda
npm test         # testy (vitest)
npm run etl      # pobranie danych z OSM dla wszystkich gmin (wymaga sieci)
npm run safety   # przebudowa safety.json z etl/safety-data.json
```

## 📁 Struktura

```
bilbao-safety-map/
├── docs/                  # PRD, ARD, ROADMAP, SAFETY_METHODOLOGY
├── etl/                   # ETL z OSM (Overpass) + cities.json (rejestr gmin)
├── test/                  # testy jednostkowe (vitest)
├── e2e/                   # testy e2e krytycznej ścieżki (Playwright)
├── public/data/           # statyczne dane (GeoJSON/JSON) z OSM + cities.json
├── src/
│   ├── main.ts            # bootstrap aplikacji
│   ├── map.ts             # MapLibre + fallback basemapy
│   ├── config.ts          # konfiguracja (widok, źródła, kolory, fonty)
│   ├── markers.ts         # ikony kategorii (kanwa)
│   ├── data/              # loader, join (testowalny), geo (bbox)
│   ├── layers/            # obszary, choropleth, places (POI+aktywności)
│   └── ui/                # legenda, sidebar, filtry, kontrolki
└── index.html
```

## 🗃️ Dane

Dane w `public/data/` pochodzą z **OpenStreetMap** (`npm run etl`). Mapa obejmuje
**Bilbao i 8 gmin z nim graniczących** — 16 jednostek, 2739 miejsc.

| Zbiór | Źródło | Stan |
|---|---|---|
| Granice 16 jednostek (9 gmin) | OSM, relacje z `etl/cities.json` | **realne** |
| POI (245) + aktywności (2494) | OSM (Overpass) | **realne** |
| Percepcja bezpieczeństwa | Ikerfel / Ratusz Bilbao 2025 | **realne, 8 dzielnic Bilbao** |
| Przestępstwa / 1000 mieszk. | Udalmap (Rząd Kraju Basków), 2024 | **realne, wszystkie 9 gmin** |

### Dane o bezpieczeństwie

Mapa pokazuje **dwie niezależne metryki**. Celowo nie są zlane w jeden „indeks
bezpieczeństwa" — mierzą co innego, pochodzą z innych źródeł i obejmują inny
obszar. Zważenie ich w jedną liczbę wyglądałoby precyzyjnie, a byłoby wymysłem.

**1. Percepcja bezpieczeństwa (0–10)** — [*Estudio de Percepción de Seguridad y
Victimización 2025*](https://www.deia.eus/bilbao/2026/02/17/aprueba-seguridad-bilbao-10712595.html),
Ratusz Bilbao, badanie Ikerfel: 8580 wywiadów telefonicznych, osoby 16+, III–XII 2025.

| Dzielnica | 2025 | 2024 |
|---|---|---|
| Deusto | 5,83 | 6,02 |
| Uribarri | 5,79 | 5,77 |
| Otxarkoaga-Txurdinaga | 5,66 | 5,76 |
| Errekalde | 5,56 | 5,52 |
| Basurtu-Zorrotza | 5,50 | 5,72 |
| Ibaiondo | 5,48 | 5,65 |
| Begoña | 5,47 | 5,72 |
| Abando | 5,44 | 5,72 |

Całe miasto 5,58; nocą 5,24. **Percepcja nocna jest publikowana tylko zbiorczo**,
nie per dzielnica — dlatego nie ma trybu „dzień/noc". Rozpiętość między
dzielnicami to 0,39 pkt; skala kolorów jest stała, żeby jej nie wyolbrzymiać.

**2. Przestępstwa na 1000 mieszkańców (‰), 2024** — [Udalmap, Rząd Kraju Basków](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/)
([API](https://api.euskadi.eus/udalmap/indicators/110)). Obejmuje **wszystkie 251 gmin**
— bez progu ludnościowego, więc także te najmniejsze.

| Gmina | 2024 | 2023 | Zmiana |
|---|---|---|---|
| Zamudio | 74,8 | 67,4 | +11,0% |
| Bilbao | 66,6 | 65,6 | +1,5% |
| Erandio | 60,1 | 58,3 | +3,1% |
| Barakaldo | 52,2 | 55,6 | −6,2% |
| Alonsotegi | 50,6 | 47,0 | +7,6% |
| Sondika | 48,2 | 61,2 | −21,2% |
| Basauri | 46,7 | 49,3 | −5,4% |
| Arrigorriaga | 37,3 | 36,1 | +3,2% |
| Etxebarri | 28,7 | 29,4 | −2,4% |
| *Bizkaia (odniesienie)* | *49,6* | *49,9* | *−0,7%* |

Wartość dotyczy całej gminy; dzielnice Bilbao dziedziczą liczbę miejską z jawnym
ostrzeżeniem w panelu, bo rozbicia na dzielnice nikt nie publikuje. Rząd wielkości
potwierdzony niezależnie kwartalnymi danymi Eustat/Ertzaintza (Bilbao 16,3‰ za
I kw. 2026 ≈ 66,6‰ rocznie).

> **Uwaga interpretacyjna:** to przestępstwa *zgłoszone*, dzielone przez liczbę
> *mieszkańców*. Gminy z dużym ruchem przyjezdnych — Zamudio ma park technologiczny,
> Sondika lotnisko — mają wskaźnik zawyżony, bo zdarzenia generują też osoby
> spoza gminy. Wysoka pozycja Zamudio to w dużej mierze ten efekt, a nie
> „niebezpieczna dzielnica".

> ⚠️ **Szary kolor to brak pomiaru, nie „bezpiecznie".** Nie wypełniamy go
> szacunkami. Dane i cytowania: [`etl/safety-data.json`](etl/safety-data.json);
> `public/data/safety.json` jest z nich generowane (`npm run safety`).

### Odświeżenie danych

```bash
npm run etl                    # wszystkie gminy z etl/cities.json
npm run etl -- barakaldo       # tylko wybrane
npm run etl -- --refresh       # ignoruj cache, pobierz od nowa
```

Gminy są przypięte po **ID relacji**, nie po nazwie — samo `name="Bilbao"` dopasowuje
trzy różne Bilbao (Hiszpania, Ekwador, Kolumbia). Nowe miasto dodajesz jednym wpisem
w `etl/cities.json`.

Surowe odpowiedzi Overpass lądują w `etl/.cache/`, więc ponowny przebieg dociąga tylko
brakujące gminy — publiczne lustra sypią się losowo (429/502/504) i bez cache'u upadek
na ostatniej gminie kasowałby pobranie wszystkich poprzednich.

Szczegóły: [`etl/README.md`](etl/README.md) i [`docs/ARD.md`](docs/ARD.md).

## 📄 Dokumentacja

- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture (ARD)](docs/ARD.md)
- [Roadmap](docs/ROADMAP.md)
- [Metodologia bezpieczeństwa](docs/SAFETY_METHODOLOGY.md)

## ⚖️ Licencja i atrybucja

Kod: **MIT**. Dane mapowe: **© OpenStreetMap contributors** (ODbL) — atrybucja wymagana na mapie.
