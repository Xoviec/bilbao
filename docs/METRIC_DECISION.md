# Wybór jednego miernika dla całej mapy

**Status:** zdecydowane · **Data:** 2026-09-01

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

### Wybrano: wariant A

**Jeden wskaźnik: przestępstwa na 1000 mieszkańców (Udalmap, rok 2024).
Jedna jednostka: gmina. Dziewięć obszarów, dziewięć różnych wartości.**

Uzasadnienie:

- To **jedyny wariant, w którym mapa nadal mówi o bezpieczeństwie**. Warianty B i C
  są ładniejsze i drobniejsze, ale mierzą zamożność. Pokazywanie dochodu pod
  szyldem mapy bezpieczeństwa byłoby podmianą tematu.
- **Zero powtórzeń.** Dziewięć kształtów, dziewięć niezależnych pomiarów:
  Zamudio 74,8 · Bilbao 66,6 · Erandio 60,1 · Barakaldo 52,2 · Alonsotegi 50,6 ·
  Sondika 48,2 · Basauri 46,7 · Arrigorriaga 37,3 · Etxebarri 28,7.
- **Dane zweryfikowane** co do setnych wobec świeżego pliku z euskadi.eus, rząd
  wielkości potwierdzony niezależnie kwartalnymi danymi Eustat/Ertzaintza
  (Bilbao 16,3‰ za I kw. 2026 ≈ 66,6‰ rocznie).
- Rozpiętość **2,61×** — kolor niesie realną informację, bez naciągania skali.

### Czego świadomie się pozbywamy

- **Dzielnice przestają być jednostką mapy.** Nie znikają z danych, ale nie są już
  kolorowane ani klikane jako obszary — bo nie ma dla nich pomiaru.
- **Percepcja przestaje być warstwą mapy.** Istnieje tylko dla Bilbao, więc z
  definicji nie może być jednolita. Trafia do panelu gminy Bilbao jako lista ośmiu
  wartości — informacja zostaje, ale nie udaje wskaźnika porównywalnego z resztą.
- Skutek: mapa jest **grubsza, ale spójna**. Każdy kolor znaczy to samo wszędzie.

## Warunek powrotu do dzielnic

Gdy Bilbao wdroży rekomendację EHU i zacznie publikować przestępczość per dzielnica,
wracamy do 31 dystryktów bez przebudowy: wartości dopisuje się do
`etl/safety-data.json`, a jednostkę przełącza w `etl/cities.json`.

## Źródła

- Udalmap, *Índice de delitos (‰ habitantes)* — [strona](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/) · [API](https://api.euskadi.eus/udalmap/indicators/110)
- Eustat/Ertzaintza, kwartalne infracciones penales — [tabela I/2026](https://es.eustat.eus/elementos/ele0025700/ti_infracciones-penales-conocidas-por-la-ertzaintza-en-la-cade-euskadi-por-tipos-segun-municipios-de-mas-de-20000-habitantes-i2026/tbl0025729_c.html)
- INE, granice dystryktów i sekcji — [OGC API Features](https://www.ine.es/geoserver/ogc/features/v1/collections)
- INE, *Atlas de Distribución de Renta de los Hogares* — [metodologia](https://www.ine.es/metodologia/metodologia_adrh.pdf)
- UPV/EHU, *Bilbao Hiri Segurua* (2026) — [omówienie](https://www.bizkaiagaur.com/2026/02/19/el-ayuntamiento-de-bilbao-ha-presentado-el-informe-bilbao-hiri-segurua/)
