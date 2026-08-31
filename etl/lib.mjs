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

/** Zapytanie do Overpass API (zwraca surowy JSON). */
export async function overpass(query, endpoint = "https://overpass-api.de/api/interpreter") {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}
