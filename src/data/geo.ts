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
