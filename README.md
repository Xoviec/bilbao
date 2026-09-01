# Bilbao Safety Map 🗺️

Interaktywna mapa **Bilbao i 8 sąsiadujących gmin** oparta o **OpenStreetMap**,
wizualizująca **wskaźnik bezpieczeństwa**, **aktywności** oraz **miejsca warte zobaczenia**.

Lekki, szybki i w pełni statyczny front‑end (bez backendu w MVP) — zoptymalizowany pod
kątem wydajności renderowania i czytelności danych.

---

## ✨ Co pokazuje mapa

- **Choropleth jednego wskaźnika na 31 dystryktach** — Bilbao podzielone na 8 dzielnic.
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

### Jeden wskaźnik, jedna jednostka: 31 dystryktów INE

**Bilbao dzieli się na 8 dzielnic, sąsiednie gminy na swoje dystrykty.** To jedyna
jednostka, w której cała aglomeracja ma ten sam podział i ten sam pomiar.
Uzasadnienie: [`docs/METRIC_DECISION.md`](docs/METRIC_DECISION.md).

| Gmina | Dystryktów |
|---|---|
| Bilbao | 8 (Deusto, Uribarri, Otxarkoaga-Txurdinaga, Begoña, Ibaiondo, Abando, Errekalde, Basurtu-Zorrotza) |
| Barakaldo | 9 |
| Basauri | 5 |
| Erandio | 3 |
| Arrigorriaga | 2 |
| Etxebarri, Sondika, Zamudio, Alonsotegi | po 1 |
| **Razem** | **31** |

Miernik: **dochód netto na osobę**, [INE ADRH](https://www.ine.es/metodologia/metodologia_adrh.pdf) 2023.
Zakres 15 034 – 30 762 € — wewnątrz samego Bilbao od Otxarkoaga-Txurdinaga
(15 771 €) po Abando (30 762 €). **31 obszarów, 31 różnych wartości.**

> ⚠️ **To wskaźnik dochodowy, nie pomiar przestępczości.** Wybrany, bo jest jedyną
> statystyką publikowaną w tej samej jednostce dla Bilbao i wszystkich sąsiadów.
> Mapa mówi o tym wprost w legendzie i panelu metodologii.

### Bezpieczeństwo — w panelu obszaru

- **Przestępstwa na 1000 mieszkańców** ([Udalmap](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/), 2024) — mierzone **per gmina**,
  więc podpisane nazwą gminy: Zamudio 74,8 · Bilbao 66,6 · Erandio 60,1 ·
  Barakaldo 52,2 · Alonsotegi 50,6 · Sondika 48,2 · Basauri 46,7 ·
  Arrigorriaga 37,3 · Etxebarri 28,7 (Bizkaia 49,6).
- **Percepcja bezpieczeństwa** ([Ikerfel dla Ratusza Bilbao](https://www.deia.eus/bilbao/2026/02/17/aprueba-seguridad-bilbao-10712595.html), 2025) —
  osiem dzielnic Bilbao: Deusto 5,83 … Abando 5,44.

> **Dlaczego przestępczość nie jest miernikiem mapy:** nikt nie publikuje jej
> poniżej poziomu gminy. Użycie jej oznaczałoby jedną liczbę powtórzoną na ośmiu
> dzielnicach Bilbao. Sprawdzone trzykrotnie — szczegóły w dokumencie decyzji.

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
