# Metodologia wskaźnika bezpieczeństwa

Dokument opisuje, **jak liczony jest indeks bezpieczeństwa (0–100)** prezentowany na mapie.
Cel: pełna transparentność i uczciwość wobec wrażliwego tematu (unikanie stygmatyzacji dzielnic).

> ⚠️ **Stan obecny:** dane w `public/data/safety.json` są **szacunkowe/demonstracyjne**
> (placeholder). Ten dokument definiuje docelową, jawną metodologię oraz format, w jaki
> należy wpiąć realne dane. `etl/fetch-osm.mjs` generuje `safety.template.json` z kodami
> realnych dzielnic do wypełnienia.

## 1. Definicja indeksu

`safety_index ∈ [0, 100]`, gdzie **100 = najbezpieczniej**. Wartość jest wynikiem
normalizacji i ważenia kilku wskaźników cząstkowych, tak aby była **porównywalna między
dzielnicami** i odporna na wartości odstające.

## 2. Wskaźniki cząstkowe (proponowane)

| Wskaźnik | Opis | Waga (propozycja) | Kierunek |
|---|---|---|---|
| `incidents_per_1k` | Incydenty/przestępstwa na 1000 mieszkańców/rok | 0.50 | niżej = lepiej |
| `night_ratio` | Udział incydentów nocnych (kontekst pory) | 0.15 | niżej = lepiej |
| `severity` | Waga ciężkości (np. przemoc vs. drobne) | 0.20 | niżej = lepiej |
| `perception` | Ankieta/percepcja bezpieczeństwa (jeśli dostępna) | 0.15 | wyżej = lepiej |

Wagi są **jawne i konfigurowalne** — publikujemy je razem z mapą.

## 3. Normalizacja

Dla każdego wskaźnika `x` liczonego „im mniej tym lepiej" stosujemy odwróconą
normalizację min–max po wszystkich dzielnicach:

```
norm(x) = 1 - (x - min) / (max - min)         # 0..1, 1 = najlepiej
```

Dla wskaźników „im więcej tym lepiej" (np. percepcja) bez odwracania.
Odporność na outliery: przycięcie do percentyli 5–95 (winsoryzacja) przed normalizacją.

## 4. Agregacja

```
score01 = Σ (waga_i * norm_i) / Σ waga_i       # 0..1
safety_index = round(100 * score01)            # 0..100
```

`day_score` / `night_score` liczone analogicznie, ale na incydentach filtrowanych
po porze doby (jeśli dane zawierają znacznik czasu).

## 5. Trend

`trend ∈ {up, flat, down}` — porównanie `safety_index` rok do roku:
- `up` gdy poprawa > +3 pkt, `down` gdy pogorszenie < −3 pkt, inaczej `flat`.

## 6. Źródła danych (otwarte, do potwierdzenia w Spike'u)

- **Open Data Euskadi** — otwarte dane Kraju Basków (statystyki, wskaźniki).
- **Ayuntamiento de Bilbao** — dane miejskie / portal otwartych danych.
- **Eustat** — baskijski instytut statystyczny (ludność do przeliczeń na 1k).
- **Ertzaintza / policja** — statystyki bezpieczeństwa (jeśli udostępnione otwarcie).

Jeśli realne dane per dzielnica są niedostępne, stosujemy **jawne proxy** (np. wskaźniki
na poziomie miasta rozłożone wg gęstości/typu zabudowy) — **wyraźnie oznaczone w UI**
jako szacunkowe, nigdy jako fakt.

## 7. Zasady etyczne

- **Transparentność:** metodologia i wagi publiczne; w UI widoczne źródło i data.
- **Neutralny język:** opisy bez sensacji i wartościowania mieszkańców.
- **Kontekst:** indeks to jeden wymiar; mapa pokazuje też atrakcje i aktywności.
- **Aktualność:** dane wersjonowane w repo z datą i źródłem.

## 8. Format wyjściowy (`safety.json`)

```jsonc
{
  "<kod-dzielnicy>": {
    "safety_index": 0-100,
    "day_score": 0-100,
    "night_score": 0-100,
    "incidents_per_1k": number,
    "trend": "up | flat | down",
    "summary": "krótki, neutralny opis",
    "source": "nazwa źródła + rok"   // dodać przy realnych danych
  }
}
```
