# Wybór jednego miernika dla całej mapy

**Status:** zdecydowane (wariant B) · **Data:** 2026-09-01 · **Wersja:** 2

## Problem

Mapa ma pokazywać **jeden wskaźnik, w tej samej jednostce, dla Bilbao i wszystkich
8 gmin sąsiednich**. Dotychczas pokazywała dwa, w dwóch różnych jednostkach:

| Wskaźnik | Jednostka | Pokrycie | Skutek na mapie |
|---|---|---|---|
| Percepcja (Ikerfel) | dzielnica | **tylko 8 dzielnic Bilbao** | 8 z 16 obszarów szarych |
| Przestępczość (Udalmap) | gmina | 9 gmin | 8 dzielnic Bilbao z **tą samą liczbą** |

Obie wady wynikają z jednej przyczyny: **jednostka rysowania ≠ jednostka pomiaru**.
Efekt uboczny — ta sama wartość 66,58‰ powtórzona na ośmiu kształtach — czyta się
jak zepsute dane, niezależnie od tego, co napisano w dopisku.

## Co sprawdziłem

### Przestępczość poniżej poziomu gminy — NIE ISTNIEJE

Trzy niezależne weryfikacje:

1. **Bilbao Open Data**, pełny katalog przez API `datos.gob.es` (publisher `L01480209`):
   **341 zbiorów**. Filtr `segur|delit|crimin|polic|victim|infracc|denunc|ertzain`
   daje **jedno** trafienie — „Noticias de temas de Seguridad", czyli kanał newsów.
   Zero statystyk.
2. **Katalog krajowy**, 40 zbiorów „infracciones penales": najdrobniejsza granulacja
   to **gmina**. Dalej już tylko prowincja, państwo, typ przestępstwa.
3. **Raport „Bilbao Hiri Segurua"** (UPV/EHU, luty 2026) — **rekomenduje** Ratuszowi
   dopiero *wprowadzenie* kwartalnych biuletynów bezpieczeństwa w podziale na
   dzielnice. Czyli takich danych jeszcze nie ma i miasto właśnie dostało zalecenie,
   żeby zacząć je tworzyć.

**Wniosek: nie da się uzyskać przestępczości per dzielnica. Żadną drogą.**

### Jednostka wspólna dla wszystkich gmin — ISTNIEJE

INE dzieli **każdą** hiszpańską gminę na dystrykty i sekcje censalne. Sprawdzone
przez [INE OGC API Features](https://www.ine.es/geoserver/ogc/features/v1/collections)
(warstwa `Secciones_2025`, filtr `CUMUN IN (…)`):

| Gmina | Dystrykty INE | Sekcje censalne |
|---|---|---|
| Bilbao | 8 | 271 |
| Barakaldo | 9 | 86 |
| Basauri | 5 | 36 |
| Erandio | 3 | 20 |
| Arrigorriaga | 2 | 8 |
| Etxebarri | 1 | 7 |
| Sondika | 1 | 3 |
| Alonsotegi | 1 | 3 |
| Zamudio | 1 | 2 |
| **Razem** | **31** | **436** |

Osiem dystryktów INE Bilbao pokrywa się z jego ośmioma dzielnicami administracyjnymi.
Ta sama lista 31 dystryktów wychodzi niezależnie z rejestru statystycznego INE
(zmienna `Distritos`, operacja 353) — dwa źródła INE się zgadzają.

**Ale**: jedyne dane publikowane w tej jednostce to **INE ADRH** — dochód, indeks
Giniego, odsetek osób poniżej progów dochodowych. **Nie przestępczość.**

## Rozstrzygnięcie

Nie da się mieć naraz: *(a)* jednego wskaźnika, *(b)* jednostki drobniejszej niż
gmina i *(c)* tematu bezpieczeństwa. Trzeba z czegoś zrezygnować.

| Wariant | Jednostka | Wskaźnik | Jednolity? | O bezpieczeństwie? |
|---|---|---|---|---|
| **A** | 9 gmin | przestępczość ‰ (Udalmap) | ✅ | ✅ |
| B | 31 dystryktów INE | dochód (ADRH) | ✅ | ❌ |
| C | 436 sekcji censalnych | dochód (ADRH) | ✅ | ❌ |
| D (stan obecny) | mieszana | dwa wskaźniki | ❌ | częściowo |

### Wybrano: wariant B

**Jeden wskaźnik: dochód netto na osobę (INE ADRH, rok 2023).
Jedna jednostka: dystrykt INE. 31 obszarów, 31 różnych wartości.**

Wariant A (przestępczość per gmina) był wybrany jako pierwszy i **odrzucony po
teście z użytkownikiem**: dawał 9 obszarów, czyli Bilbao jako jedną plamę.
Wymaganie „Bilbao ma być podzielone na dzielnice" jest twarde, a wariant A go
nie spełnia. Wariant B spełnia je jako **jedyny**:

| | wariant A | wariant B |
|---|---|---|
| Bilbao podzielone | ❌ 1 obszar | ✅ 8 dzielnic |
| Sąsiedzi podzieleni | ❌ po 1 | ✅ Barakaldo 9, Basauri 5, Erandio 3, Arrigorriaga 2 |
| Ten sam wskaźnik wszędzie | ✅ | ✅ |
| Powtórzone wartości | brak | brak (31/31 unikalnych) |
| Szare plamy | brak | brak |
| O bezpieczeństwie | ✅ | ❌ dochód |

Rozpiętość: **15 034 – 30 762 €**, czyli 2,05×. Wewnątrz samego Bilbao od 15 771 €
(Otxarkoaga-Txurdinaga) do 30 762 € (Abando) — kolor niesie realną informację.

### Uczciwość: to nie jest miernik przestępczości

Dochód **nie mierzy bezpieczeństwa**. Mapa mówi o tym wprost w legendzie
(pomarańczowe ostrzeżenie) i w panelu metodologii. Dane o bezpieczeństwie nie
znikają — każdy panel obszaru pokazuje:

- **przestępczość gminy**, w której leży dystrykt (Udalmap 2024), z jawnym
  podpisem, że mierzona jest per gmina i nikt nie publikuje jej per dzielnica,
- **percepcję dzielnicy** dla ośmiu dzielnic Bilbao (Ikerfel 2025).

### Warunek powrotu do przestępczości jako miernika mapy

Gdy Bilbao wdroży rekomendację EHU i zacznie publikować przestępczość per dzielnica,
wystarczy dopisać wartości do `etl/safety-data.json` i przełączyć pole `field`
w `src/config.ts` — jednostka (31 dystryktów) już jest właściwa.

## Źródła

- Udalmap, *Índice de delitos (‰ habitantes)* — [strona](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/) · [API](https://api.euskadi.eus/udalmap/indicators/110)
- Eustat/Ertzaintza, kwartalne infracciones penales — [tabela I/2026](https://es.eustat.eus/elementos/ele0025700/ti_infracciones-penales-conocidas-por-la-ertzaintza-en-la-cade-euskadi-por-tipos-segun-municipios-de-mas-de-20000-habitantes-i2026/tbl0025729_c.html)
- INE, granice dystryktów i sekcji — [OGC API Features](https://www.ine.es/geoserver/ogc/features/v1/collections)
- INE, *Atlas de Distribución de Renta de los Hogares* — [metodologia](https://www.ine.es/metodologia/metodologia_adrh.pdf)
- UPV/EHU, *Bilbao Hiri Segurua* (2026) — [omówienie](https://www.bizkaiagaur.com/2026/02/19/el-ayuntamiento-de-bilbao-ha-presentado-el-informe-bilbao-hiri-segurua/)
