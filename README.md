# Bilbao Safety Map 🗺️

Interaktywna mapa **Bilbao i 8 sąsiadujących gmin** oparta o **OpenStreetMap**,
wizualizująca **wskaźnik bezpieczeństwa**, **aktywności** oraz **miejsca warte zobaczenia**.

Lekki, szybki i w pełni statyczny front‑end (bez backendu w MVP) — zoptymalizowany pod
kątem wydajności renderowania i czytelności danych.

---

## ✨ Co pokazuje mapa

- **Choropleth bezpieczeństwa** — 8 dzielnic Bilbao (percepcja) + 8 gmin (przestępczość).
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

### Co pokazuje mapa

**Wyłącznie dane o bezpieczeństwie.** 16 obszarów: **8 dzielnic Bilbao** i 8 gmin
sąsiednich. Każdy pokolorowany statystyką mierzoną **na jego poziomie** — bo
przestępczości w podziale na dzielnice nikt nie publikuje.
Uzasadnienie: [`docs/METRIC_DECISION.md`](docs/METRIC_DECISION.md).

**Dzielnice Bilbao — percepcja bezpieczeństwa (0–10).**
[Badanie Ratusza Bilbao](https://www.deia.eus/bilbao/2026/02/17/aprueba-seguridad-bilbao-10712595.html)
(Ikerfel, 8580 wywiadów, 2025). Jedyny pomiar bezpieczeństwa robiony per dzielnica.

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

Miasto ogółem 5,58; **nocą 5,24**.

**Ofiary przestępstw — Bilbao 2025** (z tego samego badania, w nawiasie 2024):
kradzież **9,3 %** (9,2 %) · rozbój z przemocą **2,5 %** (2,7 %) · napaść na tle
seksualnym **2,5 %** (3,2 %) · zniszczenie mienia **8,1 %** (9,8 %) · oszustwo
online **53 %**. Publikowane zbiorczo dla miasta.

**Gminy sąsiednie — przestępstwa na 1000 mieszkańców.**
[Udalmap](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/), 2024:
Zamudio 74,8 · Erandio 60,1 · Barakaldo 52,2 · Alonsotegi 50,6 · Sondika 48,2 ·
Basauri 46,7 · Arrigorriaga 37,3 · Etxebarri 28,7 (Bizkaia 49,6; Bilbao 66,6).

> **Dlaczego dwie miary:** jedna miara wszędzie oznacza przestępczość per gmina,
> czyli Bilbao jako jedną plamę. Jedna miara per dzielnica istnieje tylko
> w Bilbao. Skale są rozdzielne, każda z własną legendą, a każdy obszar nosi na
> mapie swoją liczbę z jednostką.

### Odświeżenie danych

```bash
npm run etl                    # granice i miejsca z OSM
npm run etl -- --refresh       # ignoruj cache
npm run safety                 # przebudowa safety.json z etl/safety-data.json
npm run ine                    # dystrykty INE + dochód (miernik mapy)
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
