import { describe, it, expect } from "vitest";
import { bounds } from "../src/data/geo";

describe("bounds", () => {
  it("liczy bbox dla poligonu", () => {
    const poly: GeoJSON.Geometry = {
      type: "Polygon",
      coordinates: [[[-3, 43], [-2.8, 43], [-2.8, 43.3], [-3, 43.3], [-3, 43]]],
    };
    expect(bounds(poly)).toEqual([[-3, 43], [-2.8, 43.3]]);
  });

  it("liczy bbox dla punktu", () => {
    const pt: GeoJSON.Geometry = { type: "Point", coordinates: [-2.9, 43.26] };
    expect(bounds(pt)).toEqual([[-2.9, 43.26], [-2.9, 43.26]]);
  });
});
