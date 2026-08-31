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
