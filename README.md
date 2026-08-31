# Bilbao Safety Map 🗺️

Interaktywna mapa **Bilbao** oparta o **OpenStreetMap** wizualizująca dane w podziale na
dzielnice: **wskaźnik bezpieczeństwa**, **aktywności** oraz **miejsca warte zobaczenia**.

Lekki, szybki i w pełni statyczny front‑end (bez backendu w MVP) — zoptymalizowany pod
kątem wydajności renderowania i czytelności danych.

---

## ✨ Co pokazuje mapa

- **Choropleth bezpieczeństwa** — dzielnice Bilbao pokolorowane wg indeksu bezpieczeństwa (0–100).
- **Aktywności** — sport, kultura, nocne życie, tereny zielone (warstwy przełączane).
- **POI / miejsca warte zobaczenia** — atrakcje, punkty widokowe, zabytki.
- **Panel dzielnicy** — po kliknięciu: metryki bezpieczeństwa, opis, top miejsca.
- **Filtry i legenda** — przełączanie warstw, filtrowanie kategorii, interaktywna legenda.

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
```

## 📁 Struktura

```
bilbao-safety-map/
├── docs/                  # PRD, ARD, ROADMAP
├── public/data/           # statyczne dane (GeoJSON/JSON) — placeholdery do podmiany
├── src/
│   ├── main.ts            # bootstrap aplikacji
│   ├── map.ts             # inicjalizacja MapLibre
│   ├── config.ts          # konfiguracja (widok, źródła, kolory)
│   ├── data/loader.ts     # ładowanie i łączenie danych
│   ├── layers/            # warstwy: dzielnice, bezpieczeństwo, POI
│   └── ui/                # legenda, sidebar, filtry
└── index.html
```

## 🗃️ Dane

Dane w `public/data/` są **placeholderami**. Docelowe źródła (otwarte, darmowe):

- **Granice dzielnic** — OpenStreetMap (`boundary=administrative`) / Open Data Euskadi / Ayuntamiento de Bilbao.
- **Bezpieczeństwo** — otwarte statystyki policyjne / Eustat / dane miejskie (indeks liczony w ETL).
- **Aktywności / POI** — OSM (Overpass API), kategorie `amenity`, `leisure`, `tourism`.

Szczegóły modelu danych i pipeline’u w [`docs/ARD.md`](docs/ARD.md).

## 📄 Dokumentacja

- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture (ARD)](docs/ARD.md)
- [Roadmap](docs/ROADMAP.md)

## ⚖️ Licencja i atrybucja

Kod: **MIT**. Dane mapowe: **© OpenStreetMap contributors** (ODbL) — atrybucja wymagana na mapie.
