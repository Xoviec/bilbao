# Bilbao Safety Map 🗺️

Interaktywna mapa **Bilbao i 8 sąsiadujących gmin** oparta o **OpenStreetMap**,
wizualizująca **wskaźnik bezpieczeństwa**, **aktywności** oraz **miejsca warte zobaczenia**.

Lekki, szybki i w pełni statyczny front‑end (bez backendu w MVP) — zoptymalizowany pod
kątem wydajności renderowania i czytelności danych.

---

## ✨ Co pokazuje mapa

- **Choropleth jednego wskaźnika na 9 gminach** — przestępstwa na 1000 mieszkańców.
- **Panel obszaru** — wartość, trend r/r, odniesienie do prowincji, źródło.
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

Granice i miejsca pochodzą z **OpenStreetMap** (`npm run etl`). Mapa obejmuje
**Bilbao i 8 gmin z nim graniczących**.

### Jeden wskaźnik, jedna jednostka

Mapa pokazuje **przestępstwa na 1000 mieszkańców, per gmina** — dziewięć obszarów,
dziewięć niezależnych pomiarów. Pełne uzasadnienie wyboru:
[`docs/METRIC_DECISION.md`](docs/METRIC_DECISION.md).

Źródło: [Udalmap, Rząd Kraju Basków](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/), rok 2024.

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

> **Dlaczego nie per dzielnica:** przestępczości poniżej poziomu gminy **nikt nie
> publikuje**. Sprawdzone trzykrotnie — cały katalog Bilbao Open Data (341 zbiorów,
> zero statystyk), katalog krajowy (granulacja kończy się na gminie) i raport
> *Bilbao Hiri Segurua* (UPV/EHU, 2026), który miastu dopiero **rekomenduje**
> publikowanie takich danych. Wcześniej osiem dzielnic Bilbao dostawało tę samą
> liczbę miejską i wyglądało to jak zepsute dane.

> **Uwaga interpretacyjna:** to przestępstwa *zgłoszone*, dzielone przez liczbę
> *mieszkańców*. Gminy z dużym ruchem przyjezdnych — Zamudio ma park
> technologiczny, Sondika lotnisko — mają wskaźnik zawyżony.

### Percepcja bezpieczeństwa — osobno

[Badanie Ratusza Bilbao](https://www.deia.eus/bilbao/2026/02/17/aprueba-seguridad-bilbao-10712595.html)
(Ikerfel, 8580 wywiadów, 2025) obejmuje **tylko Bilbao**, więc nie może być
miernikiem mapy. Jest w panelu gminy Bilbao jako lista ośmiu dzielnic:
Deusto 5,83 · Uribarri 5,79 · Otxarkoaga-Txurdinaga 5,66 · Errekalde 5,56 ·
Basurtu-Zorrotza 5,50 · Ibaiondo 5,48 · Begoña 5,47 · Abando 5,44.
Miasto ogółem 5,58; nocą 5,24.

### Odświeżenie danych

```bash
npm run etl                    # granice i miejsca z OSM
npm run etl -- --refresh       # ignoruj cache
npm run safety                 # przebudowa safety.json z etl/safety-data.json
```

Gminy są przypięte po **ID relacji** OSM w `etl/cities.json` — samo `name="Bilbao"`
dopasowuje trzy różne Bilbao (Hiszpania, Ekwador, Kolumbia).

Szczegóły: [`etl/README.md`](etl/README.md) i [`docs/ARD.md`](docs/ARD.md).

## 📄 Dokumentacja

- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture (ARD)](docs/ARD.md)
- [Roadmap](docs/ROADMAP.md)
- [Metodologia bezpieczeństwa](docs/SAFETY_METHODOLOGY.md)

## ⚖️ Licencja i atrybucja

Kod: **MIT**. Dane mapowe: **© OpenStreetMap contributors** (ODbL) — atrybucja wymagana na mapie.
