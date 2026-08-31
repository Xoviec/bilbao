import { describe, it, expect } from "vitest";
// @ts-expect-error — moduł .mjs bez typów (narzędzie ETL)
import { slug, pointInGeometry, assignDistrict, bbox } from "../etl/lib.mjs";

describe("ETL lib", () => {
  it("slug usuwa diakrytyki i normalizuje", () => {
    expect(slug("Begoña")).toBe("begona");
    expect(slug("Otxarkoaga - Txurdinaga")).toBe("otxarkoaga-txurdinaga");
    expect(slug("Basurto/Zorroza")).toBe("basurto-zorroza");
  });

  const square = { type: "Polygon", coordinates: [[[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]] };

  it("pointInGeometry: wnętrze vs zewnętrze", () => {
    expect(pointInGeometry([0, 0], square)).toBe(true);
    expect(pointInGeometry([2, 2], square)).toBe(false);
  });

  it("assignDistrict zwraca kod lub null", () => {
    const districts = [{ properties: { code: "a" }, geometry: square }];
    expect(assignDistrict([0, 0], districts)).toBe("a");
    expect(assignDistrict([5, 5], districts)).toBeNull();
  });

  it("bbox liczy zakres", () => {
    expect(bbox(square)).toEqual([-1, -1, 1, 1]);
  });
});
