# ETL — pobieranie realnych danych z OpenStreetMap

Skrypt `fetch-osm.mjs` pobiera **realne granice dzielnic Bilbao oraz POI/aktywności**
z OpenStreetMap (Overpass API) i generuje pliki do `public/data/`.

## Wymagania
- Node ≥ 20 (globalny `fetch`).
- **Otwarty dostęp sieciowy do Overpass API** (`overpass-api.de`).

## Uruchomienie
```bash
npm install          # instaluje m.in. osmtogeojson
npm run etl          # node etl/fetch-osm.mjs
```

## Konfiguracja (zmienne środowiskowe)
| Zmienna | Domyślnie | Opis |
|---|---|---|
| `OVERPASS_URL` | `https://overpass-api.de/api/interpreter` | Endpoint Overpass (można podać mirror) |
| `DISTRICT_ADMIN_LEVEL` | `9` | Poziom administracyjny dzielnic (spróbuj `10`, jeśli `9` nic nie zwróci) |

```bash
DISTRICT_ADMIN_LEVEL=10 npm run etl
```

## Co generuje
| Plik | Zawartość |
|---|---|
| `public/data/districts.geojson` | Granice dzielnic (Polygon/MultiPolygon) z `code` i `name` |
| `public/data/poi.geojson` | Miejsca warte zobaczenia (`tourism`, `historic`) |
| `public/data/activities.geojson` | Aktywności (`leisure`, `amenity`) z kategoriami |
| `public/data/safety.template.json` | **Szablon** danych bezpieczeństwa (kody dzielnic + `null`) |

## Dane bezpieczeństwa
OSM **nie zawiera** statystyk bezpieczeństwa. Skrypt tworzy jedynie szablon
`safety.template.json` z realnymi kodami dzielnic. Uzupełnij go realnymi danymi wg
[`docs/SAFETY_METHODOLOGY.md`](../docs/SAFETY_METHODOLOGY.md) i zapisz jako
`public/data/safety.json`.

## Jak to działa
1. Pobiera obszar miasta (`admin_level=8`, name=Bilbao).
2. Pobiera relacje granic dzielnic → `osmtogeojson` składa poligony.
3. Pobiera POI/aktywności (nody/waye z `out center`) i mapuje tagi OSM na kategorie.
4. Przypisuje każdemu punktowi dzielnicę (point-in-polygon).
5. Zapisuje pliki + szablon bezpieczeństwa.

> Uwaga: uszanuj politykę użycia Overpass (limity zapytań). Do produkcji rozważ
> własny mirror lub eksport przez `osmium`/Geofabrik.
