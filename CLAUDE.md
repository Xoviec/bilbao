# CLAUDE.md — przewodnik projektu

Interaktywna mapa Bilbao (OSM) z wizualizacją bezpieczeństwa dzielnic, aktywności i POI.
Lekki, statyczny front‑end. Ten plik to skrót dla osób (i agentów) pracujących nad repo.

## Komendy
```bash
npm install
npm run dev      # dev-server (Vite)
npm run build    # tsc --noEmit + vite build → dist/
npm test         # testy jednostkowe (vitest)
npm run e2e      # testy e2e (Playwright, buduje i podnosi preview)
npm run etl      # pobranie realnych danych z OSM (wymaga sieci → Overpass)
```

## Architektura (skrót)
- **Static‑first, bez backendu.** Dane to statyczne pliki w `public/data/`.
- **MapLibre GL** renderuje kafle wektorowe OSM; przy niedostępności dostawcy —
  fallback rastrowy (`src/map.ts`, `config.FALLBACK_STYLE`).
- **UI jest odsprzężone od gotowości mapy:** legenda/filtry/kontrolki renderują się
  od razu po załadowaniu danych; warstwy mapy dołączają się na zdarzeniu `load`
  (`src/main.ts`). Nie przywracaj gate'owania UI na `map load` — to psuje UX i e2e.
- **Dzielnice** (`layers/districts.ts`) — choropleth wg `safety_index`/`day_score`/`night_score`,
  hover/tooltip/click, `feature-state`, `promoteId: "code"`.
- **Miejsca** (`layers/places.ts`) — POI + aktywności w jednym źródle, clustering,
  ikony kategorii (`markers.ts`), filtr kategorii przez `setData`.

## Model danych
- `districts.geojson` — `properties.code` (klucz join), `name`.
- `safety.json` — mapa `code → { safety_index, day_score, night_score, ... }`.
- `poi.geojson` / `activities.geojson` — punkty z `category`.
- Join geometrii z metrykami: **czysty** `data/join.ts` (testowalny, bez sieci).

## Zasady
- **Dane bezpieczeństwa są wrażliwe** — trzymaj się `docs/SAFETY_METHODOLOGY.md`
  (jawność, neutralny język, oznaczanie danych szacunkowych).
- Granice i POI w `public/data/` są **realne** (OSM, `npm run etl`).
  Wskaźniki bezpieczeństwa **ma tylko Bilbao i są szacunkowe**; pozostałe gminy
  mają `null`. Flaga `_placeholder` w `safety.json` steruje ostrzeżeniem w UI —
  nie usuwaj jej bez realnych danych i **nie wypełniaj nulli zmyślonymi liczbami**.
- Gminy są przypięte po **ID relacji** w `etl/cities.json`. Nie wracaj do
  wyszukiwania po nazwie — `name="Bilbao"` dopasowuje też Ekwador i Kolumbię.
- **Dwie rozdzielczości są zamierzone.** W całej Bizkaia tylko Bilbao ma w OSM
  podział poniżej gminy, więc sąsiedzi to pojedyncze poligony (`level` na featerze).
  Legenda, panel i sidebar muszą o tym mówić — jednolity kolor to brak danych,
  nie jednorodność terenu.
- Kody jednostek są przestrzeniowane gminą (`bilbao-abando`, `barakaldo`), bo same
  slugi kolidują. Zmiana kodów wymaga migracji kluczy `safety.json` — inaczej join
  po cichu gubi jednostki (łapie to test integralności).
- Atrybucja **© OpenStreetMap contributors** jest wymagana na mapie (ODbL).
- Zmiany waliduj: `npm test && npm run build` (a dla UI również `npm run e2e`).

## Dokumentacja
`docs/PRD.md` · `docs/ARD.md` · `docs/ROADMAP.md` · `docs/SAFETY_METHODOLOGY.md`
