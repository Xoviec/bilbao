// Współdzielone narzędzia ETL (bez zależności zewnętrznych poza osmtogeojson w fetch-osm).

/** Slug z nazwy: małe litery, bez znaków diakrytycznych, myślniki. */
export function slug(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ray casting: czy punkt [lng,lat] leży w pierścieniu (tablica [lng,lat]). */
function pointInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Czy punkt leży w geometrii Polygon/MultiPolygon (GeoJSON). */
export function pointInGeometry(pt, geometry) {
  if (!geometry) return false;
  const polys =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  for (const poly of polys) {
    const [outer, ...holes] = poly;
    if (pointInRing(pt, outer) && !holes.some((h) => pointInRing(pt, h))) return true;
  }
  return false;
}

/** Przypisuje kod dzielnicy do punktu na podstawie granic dzielnic. */
export function assignDistrict(pt, districts) {
  for (const d of districts) {
    if (pointInGeometry(pt, d.geometry)) return d.properties.code;
  }
  return null;
}

/** Bounding box [minLng,minLat,maxLng,maxLat] geometrii. */
export function bbox(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      minX = Math.min(minX, c[0]); minY = Math.min(minY, c[1]);
      maxX = Math.max(maxX, c[0]); maxY = Math.max(maxY, c[1]);
    } else c.forEach(walk);
  };
  walk(geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

// Lustra próbowane po kolei — publiczne overpass-api.de zwraca 429/504 pod obciążeniem
// zamiast czekać, więc pojedyncza próba na jednym serwerze to za mało.
//
// WAŻNE: tylko instancje z danymi CAŁEJ planety. overpass.osm.ch (Szwajcaria) był tu
// wcześniej i na zapytanie o Bilbao zwracał HTTP 200 z PUSTĄ listą — odpowiedź nie do
// odróżnienia od „obszar nie istnieje", przez co ETL cicho uznawał, że dzielnic nie ma.
export const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Overpass odrzuca (406) requesty bez identyfikującego się User-Agenta — wymaga tego
// polityka użycia API.
const HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "bilbao-safety-map/0.1 (+https://github.com/Xoviec/bilbao)",
};

/**
 * Zapytanie do Overpass API (zwraca surowy JSON). Przechodzi po lustrach aż któreś odpowie.
 *
 * `minElements` — ile elementów MUSI wrócić, żeby uznać odpowiedź za wiarygodną.
 * Publiczne instancje pod obciążeniem potrafią oddać HTTP 200 z pustą listą i BEZ pola
 * `remark` — nie do odróżnienia od obszaru, w którym faktycznie nic nie ma. Dla zapytań,
 * o których wiemy, że wynik nie może być pusty (granice dzielnic), taka odpowiedź to błąd.
 */
export async function overpass(query, endpoint, { log = () => {}, minElements = 0, attempts = 3 } = {}) {
  // Jawny endpoint (np. z OVERPASS_URL) idzie pierwszy, reszta jako zapas.
  const urls = endpoint
    ? [endpoint, ...OVERPASS_MIRRORS.filter((u) => u !== endpoint)]
    : OVERPASS_MIRRORS;

  let last;
  for (let attempt = 0; attempt < attempts; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: HEADERS,
          body: "data=" + encodeURIComponent(query),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Overpass sygnalizuje błąd wykonania (timeout, limit pamięci) w polu `remark`
        // przy statusie 200 i pustej liście elementów. Bez tego sprawdzenia taka
        // odpowiedź przechodzi jako poprawna i po cichu gubi dane.
        if (data.remark) throw new Error(`remark: ${data.remark}`);
        const n = data.elements?.length ?? 0;
        if (n < minElements) throw new Error(`pusta odpowiedź (${n} < ${minElements})`);
        return data;
      } catch (e) {
        last = e;
        log(`  [overpass] ${new URL(url).host}: ${e.message} — próbuję dalej`);
      }
    }
    // Backoff rośnie: lustra są przeciążone, natychmiastowe ponowienie tylko dokłada ruchu.
    if (attempt + 1 < attempts) {
      const wait = 10000 * (attempt + 1);
      log(`  [overpass] wszystkie lustra odmówiły — czekam ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error(`wszystkie lustra Overpass odmówiły: ${last?.message}`);
}
