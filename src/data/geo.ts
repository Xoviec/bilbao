/** Bounding box [[minLng,minLat],[maxLng,maxLat]] geometrii GeoJSON. */
export function bounds(geometry: GeoJSON.Geometry): [[number, number], [number, number]] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (c: unknown): void => {
    if (typeof (c as number[])[0] === "number") {
      const [x, y] = c as number[];
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    } else {
      (c as unknown[]).forEach(walk);
    }
  };
  if ("coordinates" in geometry) walk(geometry.coordinates);
  return [[minX, minY], [maxX, maxY]];
}

export type Bounds = [[number, number], [number, number]];

/** Bounding box obejmujący wszystkie featery kolekcji. */
export function collectionBounds(fc: GeoJSON.FeatureCollection): Bounds {
  const boxes = fc.features
    .filter((f) => f.geometry)
    .map((f) => bounds(f.geometry as GeoJSON.Geometry));
  if (!boxes.length) throw new Error("Pusta kolekcja — nie da się wyznaczyć zakresu");
  return boxes.reduce<Bounds>(
    (a, b) => [
      [Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])],
      [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])],
    ],
    boxes[0],
  );
}

/**
 * Rozszerza zakres o margines podany jako ułamek jego rozmiaru.
 * Bez tego `maxBounds` przycina widok dokładnie do granic danych i nie da się
 * odsunąć kamery na tyle, by zobaczyć skrajne gminy w całości.
 */
export function padBounds(b: Bounds, ratio = 0.08): Bounds {
  const dx = (b[1][0] - b[0][0]) * ratio;
  const dy = (b[1][1] - b[0][1]) * ratio;
  return [
    [b[0][0] - dx, b[0][1] - dy],
    [b[1][0] + dx, b[1][1] + dy],
  ];
}

/** Środek zakresu. */
export function boundsCenter(b: Bounds): [number, number] {
  return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
}

/** Ray casting: czy punkt [lng,lat] leży w pierścieniu. */
function pointInRing(pt: [number, number], ring: number[][]): boolean {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Czy punkt leży w geometrii Polygon/MultiPolygon.
 * Potrzebne, bo podział INE nie pokrywa się z podziałem OSM — miejsca trzeba
 * przypisać do dystryktów geometrycznie, a nie po kodzie.
 */
export function pointInGeometry(pt: [number, number], geometry: GeoJSON.Geometry): boolean {
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
