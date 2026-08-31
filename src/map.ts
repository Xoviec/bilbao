import maplibregl from "maplibre-gl";
import { BILBAO, BASEMAP_STYLE } from "./config";

/** Tworzy i zwraca instancję mapy MapLibre wycentrowaną na Bilbao. */
export function createMap(container: string | HTMLElement): maplibregl.Map {
  const map = new maplibregl.Map({
    container,
    style: BASEMAP_STYLE,
    center: BILBAO.center,
    zoom: BILBAO.zoom,
    minZoom: BILBAO.minZoom,
    maxZoom: BILBAO.maxZoom,
    maxBounds: BILBAO.maxBounds,
    attributionControl: false,
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.addControl(
    new maplibregl.AttributionControl({
      compact: true,
      customAttribution: "© OpenStreetMap contributors",
    }),
    "bottom-right",
  );

  return map;
}
