# PRD — Bilbao Safety Map

**Wersja:** 0.1 (draft) · **Status:** MVP planning · **Właściciel:** Adrian Gąsiorek

---

## 1. Wizja i cel

Stworzyć **interaktywną, szybką mapę Bilbao**, która w jednym miejscu pokazuje, jak
**bezpieczne** są poszczególne dzielnice oraz **co warto w nich robić i zobaczyć**.
Produkt ma pomagać mieszkańcom, turystom i osobom relokującym się w podejmowaniu
decyzji „gdzie mieszkać / gdzie iść / czego unikać”, prezentując dane w sposób
czytelny i pozbawiony żargonu.

**Zdanie‑wizja:** *„Otwórz mapę Bilbao i w 10 sekund zrozum bezpieczeństwo i charakter
każdej dzielnicy.”*

## 2. Problem

- Informacje o bezpieczeństwie dzielnic są rozproszone, tekstowe i trudne do porównania.
- Turyści nie wiedzą, które rejony są warte odwiedzenia i o jakiej porze.
- Brakuje jednego, wizualnego widoku łączącego **bezpieczeństwo + aktywności + atrakcje**.

## 3. Persony (grupy docelowe)

| Persona | Potrzeba | Kluczowy scenariusz |
|---|---|---|
| **Turysta** | Gdzie jest bezpiecznie i co zobaczyć | Planuje trasę zwiedzania, unika ryzykownych rejonów nocą |
| **Relokujący się / student** | Gdzie wynająć mieszkanie | Porównuje dzielnice wg bezpieczeństwa i udogodnień |
| **Mieszkaniec** | Aktywności w okolicy | Szuka terenów zielonych, sportu, wydarzeń |
| **Analityk / dziennikarz** | Dane i trendy | Eksploruje wskaźniki, eksportuje widok |

## 4. Zakres

### 4.1 W zakresie (MVP)
- Mapa OSM (MapLibre GL) wycentrowana na Bilbao.
- Podział na **dzielnice** (distritos) z granicami (choropleth).
- **Wskaźnik bezpieczeństwa** per dzielnica (0–100) z kolorystyką i legendą.
- Panel szczegółów dzielnicy po kliknięciu.
- Warstwy **aktywności** i **POI** (przełączane, kategorie).
- Filtry warstw + interaktywna legenda.
- W pełni responsywny, statyczny front‑end.

### 4.2 Poza zakresem (MVP)
- Konta użytkowników / logowanie.
- Backend, baza danych, API w czasie rzeczywistym.
- Dane crowdsourcingowe / zgłaszanie incydentów przez użytkowników.
- Wyznaczanie tras (routing).
- Wersje mobilne natywne (tylko web responsive).

## 5. Funkcjonalności (priorytety MoSCoW)

| ID | Funkcja | Priorytet |
|---|---|---|
| F1 | Renderowanie mapy OSM (MapLibre) | Must |
| F2 | Warstwa granic dzielnic | Must |
| F3 | Choropleth bezpieczeństwa + legenda | Must |
| F4 | Panel szczegółów dzielnicy (klik) | Must |
| F5 | Warstwa POI (miejsca warte zobaczenia) | Should |
| F6 | Warstwa aktywności + kategorie | Should |
| F7 | Przełączanie warstw / filtry | Should |
| F8 | Hover‑tooltip z nazwą i indeksem | Should |
| F9 | Wyszukiwarka dzielnicy | Could |
| F10 | Przełącznik dzień/noc (bezpieczeństwo wg pory) | Could |
| F11 | Eksport widoku / link do stanu mapy | Could |
| F12 | Tryb ciemny UI | Could |

## 6. User stories (wybór)

- **US‑1:** Jako turysta chcę zobaczyć dzielnice pokolorowane wg bezpieczeństwa, aby ocenić, gdzie jest bezpiecznie.
- **US‑2:** Jako relokujący się chcę kliknąć dzielnicę i zobaczyć jej metryki i opis, aby ją porównać.
- **US‑3:** Jako mieszkaniec chcę włączyć warstwę „tereny zielone / sport”, aby znaleźć aktywności w pobliżu.
- **US‑4:** Jako użytkownik chcę filtrować kategorie POI, aby ograniczyć hałas na mapie.
- **US‑5:** Jako użytkownik mobilny chcę, aby mapa działała płynnie na telefonie.

## 7. Wymagania dot. danych

| Zbiór | Pola (min.) | Źródło docelowe |
|---|---|---|
| Dzielnice (geometria) | `id`, `name`, `polygon` | OSM / Open Data Euskadi |
| Bezpieczeństwo | `district_id`, `safety_index`, `incidents`, `day_score`, `night_score` | Statystyki miejskie / policyjne (ETL) |
| Aktywności | `id`, `name`, `category`, `lng/lat`, `district_id` | OSM Overpass |
| POI | `id`, `name`, `type`, `lng/lat`, `rating?`, `district_id` | OSM Overpass |

**Indeks bezpieczeństwa** — liczba 0–100 (100 = najbezpieczniej), normalizowana w warstwie ETL;
metodologia opisana w ARD i widoczna w UI (transparentność).

## 8. Wymagania niefunkcjonalne

- **Wydajność:** pierwszy sensowny render < 2 s (dobre łącze); płynny pan/zoom (60 FPS docelowo).
- **Rozmiar:** bundle aplikacji (bez silnika mapy) < 100 kB gzip.
- **Dostępność:** kontrasty WCAG AA, paleta czytelna dla daltonistów (color‑blind safe).
- **Responsywność:** desktop + mobile.
- **Prywatność:** brak trackingu w MVP, brak danych osobowych.

## 9. Metryki sukcesu (KPI)

- Czas do „zrozumienia” dzielnicy (klik → panel) < 3 s.
- % użytkowników wchodzących w interakcję z ≥1 dzielnicą.
- Lighthouse Performance ≥ 90.
- Liczba wizyt / powracających (po wdrożeniu analityki opt‑in).

## 10. Ryzyka i założenia

| Ryzyko | Wpływ | Mitygacja |
|---|---|---|
| Brak/niska jakość otwartych danych o bezpieczeństwie | Wysoki | Jawna metodologia, oznaczenie „dane szacunkowe”, wersjonowanie |
| Wrażliwość tematu (stygmatyzacja dzielnic) | Średni | Neutralny język, kontekst, źródła, brak sensacji |
| Wydajność przy dużej liczbie POI | Średni | Clustering, vector tiles, lazy load |
| Licencje danych | Średni | Tylko źródła otwarte (OSM/ODbL), pełna atrybucja |

## 11. Otwarte pytania

- Jakie dokładnie źródło danych o przestępczości jest dostępne dla Bilbao?
- Podział na 8 distritos czy głębszy (barrios)?
- Czy potrzebna jest wersja wielojęzyczna (ES/EU/EN/PL)?
