import maplibregl, { type StyleSpecification } from "maplibre-gl";
import { BILBAO, BASEMAP_STYLE, FALLBACK_STYLE } from "./config";

/**
 * Wybiera styl mapy: próbuje pobrać podstawowy (wektorowy OSM),
 * a przy niedostępności dostawcy używa awaryjnego stylu rastrowego.
 * Dzięki temu brak basemapy nie kończy się pustą, cichą mapą.
 */
async function resolveStyle(): Promise<string | StyleSpecification> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(BASEMAP_STYLE, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) return BASEMAP_STYLE;
    console.warn(`Basemap ${BASEMAP_STYLE} → HTTP ${res.status}. Używam fallbacku rastrowego.`);
  } catch (e) {
    console.warn("Basemap niedostępny, używam fallbacku rastrowego:", e);
  }
  notify("Podstawowy dostawca kafli jest niedostępny — mapa działa w trybie awaryjnym (OSM raster).");
  return FALLBACK_STYLE as StyleSpecification;
}

/** Tworzy i zwraca instancję mapy MapLibre wycentrowaną na Bilbao. */
export async function createMap(container: string | HTMLElement): Promise<maplibregl.Map> {
  const style = await resolveStyle();

  const map = new maplibregl.Map({
    container,
    style,
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

  // Błędy stylu/fontów/kafli nie mogą znikać po cichu.
  map.on("error", (e) => console.error("MapLibre error:", e?.error ?? e));

  return map;
}

/** Lekki, nieblokujący komunikat w rogu mapy. */
function notify(message: string): void {
  const el = document.createElement("div");
  el.className = "map-notice";
  el.textContent = message;
  document.getElementById("app")?.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}
