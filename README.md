# Bilbao Safety Map 🗺️

Interaktywna mapa **Bilbao** oparta o **OpenStreetMap** wizualizująca dane w podziale na
dzielnice: **wskaźnik bezpieczeństwa**, **aktywności** oraz **miejsca warte zobaczenia**.

Lekki, szybki i w pełni statyczny front‑end (bez backendu w MVP) — zoptymalizowany pod
kątem wydajności renderowania i czytelności danych.

---

## ✨ Co pokazuje mapa

- **Choropleth bezpieczeństwa** — dzielnice Bilbao pokolorowane wg indeksu bezpieczeństwa (0–100).
- **Tryb dzień/noc** — przełącznik pokazujący bezpieczeństwo wg pory doby.
- **Aktywności** — sport, kultura, nocne życie, tereny zielone (ikony kategorii).
- **POI / miejsca warte zobaczenia** — atrakcje, punkty widokowe, zabytki (clustering).
- **Panel dzielnicy** — po kliknięciu: metryki bezpieczeństwa, opis, trend.
- **Wyszukiwarka dzielnicy** — szybki skok do wybranej dzielnicy.
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
npm run etl      # pobranie realnych danych z OSM (wymaga sieci → Overpass)
```

## 📁 Struktura

```
bilbao-safety-map/
├── docs/                  # PRD, ARD, ROADMAP, SAFETY_METHODOLOGY
├── etl/                   # skrypt pobierania realnych danych z OSM (Overpass)
├── test/                  # testy jednostkowe (vitest)
├── e2e/                   # testy e2e krytycznej ścieżki (Playwright)
├── public/data/           # statyczne dane (GeoJSON/JSON) — placeholdery do podmiany
├── src/
│   ├── main.ts            # bootstrap aplikacji
│   ├── map.ts             # MapLibre + fallback basemapy
│   ├── config.ts          # konfiguracja (widok, źródła, kolory, fonty)
│   ├── markers.ts         # ikony kategorii (kanwa)
│   ├── data/              # loader, join (testowalny), geo (bbox)
│   ├── layers/            # dzielnice, choropleth, places (POI+aktywności)
│   └── ui/                # legenda, sidebar, filtry, kontrolki
└── index.html
```

## 🗃️ Dane

Dane w `public/data/` pochodzą z **OpenStreetMap** (`npm run etl`):

| Zbiór | Źródło | Stan |
|---|---|---|
| Granice 8 dzielnic | OSM, relacja `339549`, `admin_level=9` | **realne** |
| POI (163) + aktywności (1713) | OSM (Overpass) | **realne** |
| Wskaźniki bezpieczeństwa | — | **szacunkowe** |

Granice pokrywają gminę Bilbao dokładnie (suma dzielnic = 40,36 km² = powierzchnia
relacji gminy) i nie nachodzą na siebie.

> ⚠️ **Wskaźników bezpieczeństwa nie ma w OSM.** Wartości w `safety.json` są
> demonstracyjne i oznaczone flagą `_placeholder`, przez co aplikacja pokazuje
> ostrzeżenie. Podmień je wg [metodologii](docs/SAFETY_METHODOLOGY.md).

Odświeżenie danych z OSM:

```bash
npm run etl      # districts.geojson + poi/activities z OSM + safety.template.json
```

Skrypt jest przypięty do relacji OSM `339549` (Bilbao w Hiszpanii) — pytanie po samej
nazwie dopasowuje **trzy** różne Bilbao (jeszcze Ekwador i Kolumbia). Nadpisać można
zmienną `BILBAO_RELATION_ID`.

- **Granice dzielnic + POI/aktywności** — OpenStreetMap przez Overpass API (`npm run etl`).
- **Bezpieczeństwo** — nie ma go w OSM; uzupełnij `safety.json` wg
  [metodologii](docs/SAFETY_METHODOLOGY.md) (źródła: Open Data Euskadi / Eustat / miasto).

Szczegóły: [`etl/README.md`](etl/README.md) i [`docs/ARD.md`](docs/ARD.md).

## 📄 Dokumentacja

- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture (ARD)](docs/ARD.md)
- [Roadmap](docs/ROADMAP.md)
- [Metodologia bezpieczeństwa](docs/SAFETY_METHODOLOGY.md)

## ⚖️ Licencja i atrybucja

Kod: **MIT**. Dane mapowe: **© OpenStreetMap contributors** (ODbL) — atrybucja wymagana na mapie.
