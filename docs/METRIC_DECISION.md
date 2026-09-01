# Jaki wskaźnik bezpieczeństwa pokazuje mapa

**Status:** zdecydowane · **Wersja:** 3 · **Data:** 2026-09-01

## Pytanie, na które mapa ma odpowiadać

> Czy po tej dzielnicy można bezpiecznie chodzić?

To znaczy: **kradzieże, rozboje, pobicia** — a nie zamożność, nie demografia.
Wersja 2 tego dokumentu wybrała dochód (INE ADRH) dlatego, że jako jedyny
istnieje w tej samej jednostce wszędzie. **To był błąd** — spójność jednostki
została postawiona ponad sensem aplikacji. Mapa bezpieczeństwa ma pokazywać
bezpieczeństwo.

## Co realnie istnieje

Sprawdzone wyczerpująco (cztery niezależne przejścia):

### ❌ Liczby przestępstw per dzielnica — NIE ISTNIEJĄ

| Sprawdzone | Wynik |
|---|---|
| Bilbao Open Data (cały katalog przez API `datos.gob.es`) | 341 zbiorów, **zero** statystyk przestępczości |
| Katalog krajowy `datos.gob.es`, „infracciones penales" | 40 zbiorów, najdrobniej **gmina** |
| Eustat / Ertzaintza | gminy >20 tys. mieszkańców |
| Udalmap | wszystkie gminy, ale **tylko gmina** |
| Prasa (Deia, El Correo, Radio Nervión) | opisy „gorących punktów", **bez liczb per dzielnica** |

Raport [*Bilbao Hiri Segurua*](https://www.bizkaiagaur.com/2026/02/19/el-ayuntamiento-de-bilbao-ha-presentado-el-informe-bilbao-hiri-segurua/)
(UPV/EHU, luty 2026) **rekomenduje Ratuszowi dopiero wprowadzenie** kwartalnych
biuletynów bezpieczeństwa w podziale na dzielnice. Czyli takich danych jeszcze
nie ma — miasto właśnie dostało zalecenie, żeby zacząć je publikować.

### ✅ Percepcja bezpieczeństwa per dzielnica — ISTNIEJE

[*Estudio de Percepción de Seguridad y Victimización 2025*](https://www.deia.eus/bilbao/2026/02/17/aprueba-seguridad-bilbao-10712595.html),
Ratusz Bilbao, badanie Ikerfel: **8580 wywiadów telefonicznych**, osoby 16+,
praca terenowa III–XII 2025.

To **jedyny pomiar bezpieczeństwa robiony per dzielnica** i zarazem dosłowna
odpowiedź na pytanie „czy da się tu bezpiecznie chodzić" — mieszkańcy oceniają
własną dzielnicę.

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

### ✅ Wiktymizacja — ISTNIEJE (dla całego miasta)

Z tego samego badania. To są twarde statystyki „ilu ludzi padło ofiarą czego":

| Przestępstwo | 2025 | 2024 |
|---|---|---|
| Kradzież (hurto) | **9,3 %** | 9,2 % |
| Rozbój z przemocą | **2,5 %** | 2,7 % |
| Napaść na tle seksualnym | **2,5 %** | 3,2 % |
| Zniszczenie mienia | **8,1 %** | 9,8 % |
| Oszustwo (głównie online) | **53 %** | — |

Publikowane zbiorczo dla Bilbao, nie per dzielnica.

### ✅ Przestępczość per gmina — ISTNIEJE

[Udalmap](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/),
przestępstwa na 1000 mieszkańców, rok 2024. Wszystkie 251 gmin Kraju Basków.

Zamudio 74,8 · Bilbao 66,6 · Erandio 60,1 · Barakaldo 52,2 · Alonsotegi 50,6 ·
Sondika 48,2 · Basauri 46,7 · Arrigorriaga 37,3 · Etxebarri 28,7
(odniesienie: Bizkaia 49,6).

## Decyzja

**Mapa pokazuje wyłącznie dane o bezpieczeństwie, każdy obszar w najdrobniejszej
jednostce, w jakiej jest dla niego mierzone.**

| Obszar | Wskaźnik | Jednostka pomiaru |
|---|---|---|
| 8 dzielnic Bilbao | percepcja bezpieczeństwa 0–10 | **dzielnica** |
| 8 gmin sąsiednich | przestępstwa na 1000 mieszk. | gmina |

Razem **16 obszarów, każdy z własną wartością**. Żadnych szarych plam, żadnej
liczby powtórzonej na wielu kształtach.

### Dlaczego dwie miary, a nie jedna

Bo trzeciej możliwości nie ma:

- Jedna miara **wszędzie** = przestępczość per gmina → Bilbao jako jedna plama.
  Odrzucone: Bilbao ma być podzielone na dzielnice.
- Jedna miara **per dzielnica** = tylko percepcja → 8 gmin bez danych.
  Odrzucone: sąsiedzi mają być pokazani.
- Jedna miara **wspólna i drobna** = dochód INE → nie mierzy bezpieczeństwa.
  Odrzucone: to nie jest mapa zamożności.

Dwie miary **o tym samym temacie**, każda w swojej jednostce, są jedynym
wariantem bez utraty czegokolwiek istotnego.

### Jak to nie wprowadza w błąd

- **Osobne skale, osobne legendy.** Percepcja 0–10 (wyżej = bezpieczniej) i
  przestępczość ‰ (wyżej = gorzej) mają własne paski w legendzie, opisane
  jednostką i kierunkiem. Ten sam zielony nigdy nie znaczy dwóch rzeczy.
- **Każdy obszar ma na mapie swoją liczbę z jednostką** — „Deusto 5,83/10",
  „Barakaldo 52,2‰". Nie da się pomylić skal.
- **Panel obszaru podaje źródło i poziom pomiaru** oraz komplet statystyk
  wiktymizacyjnych dla Bilbao.

## Warunek uproszczenia do jednej miary

Gdy Bilbao wdroży rekomendację EHU i zacznie publikować przestępczość per
dzielnica, mapa przechodzi na jedną miarę bez przebudowy: wartości dopisuje się
do `etl/safety-data.json`, a `src/config.ts` przełącza pole metryki.

## Źródła

- Ikerfel dla Ratusza Bilbao, *Estudio de Percepción de Seguridad y Victimización 2025* — [Deia](https://www.deia.eus/bilbao/2026/02/17/aprueba-seguridad-bilbao-10712595.html) · [Radio Nervión (wiktymizacja)](https://www.radionervion.com/2026/02/17/seguridad-en-bilbao-2025-la-ciudadania-aprueba-con-un-558-y-senala-las-estafas-digitales-como-principal-amenaza/)
- Badanie 2024 (rok porównawczy) — [Onda Vasca](https://www.ondavasca.com/la-percepcion-de-la-seguridad-ciudadana-en-bilbao-de-5-73-sobre-10/)
- Udalmap, *Índice de delitos (‰ habitantes)* — [strona](https://www.euskadi.eus/indicadores-municipales-de-sostenibilidad-indice-de-delitos-x2030-habitantes/web01-a2nekabe/es/)
- Eustat/Ertzaintza, kontrola rzędu wielkości — [tabela I/2026](https://es.eustat.eus/elementos/ele0025700/ti_infracciones-penales-conocidas-por-la-ertzaintza-en-la-cade-euskadi-por-tipos-segun-municipios-de-mas-de-20000-habitantes-i2026/tbl0025729_c.html)
- UPV/EHU, *Bilbao Hiri Segurua* (2026) — [omówienie](https://www.bizkaiagaur.com/2026/02/19/el-ayuntamiento-de-bilbao-ha-presentado-el-informe-bilbao-hiri-segurua/)
