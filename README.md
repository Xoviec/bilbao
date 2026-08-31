# Bilbao Safety Map 🗺️

Interaktywna mapa **Bilbao i 8 sąsiadujących gmin** oparta o **OpenStreetMap**,
wizualizująca **wskaźnik bezpieczeństwa**, **aktywności** oraz **miejsca warte zobaczenia**.

Lekki, szybki i w pełni statyczny front‑end (bez backendu w MVP) — zoptymalizowany pod
kątem wydajności renderowania i czytelności danych.

---

## ✨ Co pokazuje mapa

- **Choropleth bezpieczeństwa** — obszary pokolorowane wg indeksu (0–100); szary = brak danych.
- **Tryb dzień/noc** — przełącznik pokazujący bezpieczeństwo wg pory doby.
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
| Wskaźniki bezpieczeństwa | — | **tylko Bilbao, szacunkowe** |

### Dwie rozdzielczości — i dlaczego

W **całej prowincji Bizkaia** podział administracyjny poniżej gminy ma w OSM
wyłącznie Bilbao (8 jednostek `admin_level=9`; wszystkie 25 jednostek `admin_level=10`
to również barrios Bilbao). Dlatego:

- **Bilbao** — choropleth po 8 dzielnicach,
- **pozostałe 8 gmin** — jeden obszar na gminę (`unit: "municipality"` w rejestrze).

Jednolity kolor gminy oznacza **brak danych szczegółowych, a nie jednorodność terenu** —
legenda i panel metodologii mówią to wprost.

| Gmina | Relacja OSM | Jednostki | km² | Miejsc |
|---|---|---|---|---|
| Bilbao | 339549 | 8 dzielnic | 40,4 | 1876 |
| Barakaldo | 340585 | 1 | 25,0 | 506 |
| Erandio | 347284 | 1 | 18,8 | 125 |
| Basauri | 340591 | 1 | 7,1 | 73 |
| Arrigorriaga | 340587 | 1 | 16,0 | 61 |
| Zamudio | 347287 | 1 | 17,9 | 34 |
| Etxebarri | 341790 | 1 | 3,3 | 31 |
| Sondika | 340648 | 1 | 6,8 | 21 |
| Alonsotegi | 342633 | 1 | 20,2 | 12 |

Jednostki są rozłączne (0 nakładek na 2400 losowych punktów), a przypisanie potwierdza
niezależnie reverse geocoding w Nominatim.

> ⚠️ **Wskaźników bezpieczeństwa nie ma w OSM.** Ma je dziś tylko Bilbao i są
> **szacunkowe**. Pozostałe gminy mają `null` — rysują się na szaro, bo zmyślanie
> liczb byłoby gorsze niż ich brak. Podmień wg [metodologii](docs/SAFETY_METHODOLOGY.md).

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
