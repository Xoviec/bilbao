import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

import { createMap, resolveStyle } from "./map";
import { loadAllData } from "./data/loader";
import { bounds, collectionBounds, padBounds, pointInGeometry } from "./data/geo";
import { addAreaLayers } from "./layers/districts";
import { addPlacesLayer } from "./layers/places";
import { renderLegend } from "./ui/legend";
import { showArea, type PlaceItem, type AreaView } from "./ui/sidebar";
import { renderFilters, type FilterItem } from "./ui/filters";
import { renderControls } from "./ui/controls";
import { openMethodology } from "./ui/methodology";
import { CATEGORY_COLORS, CATEGORY_LABELS, VIEW } from "./config";

const el = (id: string) => document.getElementById(id) as HTMLElement;

async function bootstrap(): Promise<void> {
  // Sondowanie dostawcy kafli i pobieranie danych biegną równolegle — oba są
  // sieciowe i niezależne, więc szeregowanie ich podwajałoby czas startu.
  const [style, data] = await Promise.all([resolveStyle(), loadAllData()]);

  // Kadr wynika z danych, nie ze stałej: zbiór gmin bywa różny (patrz
  // etl/cities.json), a zaszyty bbox Bilbao ucinałby sąsiadów.
  // Zakres z warstwy GMIN — districts.geojson trzyma już tylko dzielnice Bilbao,
  // więc sam by kadrował mapę na jedno miasto.
  const dataBounds = collectionBounds(data.ineDistricts);
  const map = createMap("map", style, {
    bounds: dataBounds,
    maxBounds: padBounds(dataBounds, VIEW.boundsPadding),
  });

  // JEDNA jednostka: dystrykt INE. Bilbao dzieli się na 8 nazwanych dzielnic,
  // sąsiedzi na swoje dystrykty — razem 31 obszarów (docs/METRIC_DECISION.md).
  const areas = data.ineDistricts.features;

  const districtByCode = new Map(areas.map((f) => [f.properties?.code as string, f]));
  // Etykieta jednostki. Dzielnicę poprzedzamy nazwą gminy, bo lista miesza dwa
  // poziomy (dzielnice Bilbao + całe gminy) i samo "Abando" nie mówi, gdzie to jest.
  const labelOf = (f: GeoJSON.Feature): string => {
    const name = f.properties?.name as string;
    const cityName = f.properties?.cityName as string | undefined;
    return f.properties?.level === "district" && cityName ? `${cityName} — ${name}` : name;
  };


  // Wspólne źródło miejsc: POI + aktywności.
  const places: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [...data.poi.features, ...data.activities.features],
  };

  // Miejsca pogrupowane wg dzielnicy (do panelu).
  const placesByDistrict = new Map<string, PlaceItem[]>();
  for (const f of places.features) {
    const d = f.properties?.district as string | undefined;
    if (!d) continue;
    const item = {
      name: f.properties?.name as string,
      category: f.properties?.category as string,
    };
    placesByDistrict.set(d, [...(placesByDistrict.get(d) ?? []), item]);
  }

  // Miejsca przypisujemy do dystryktów INE geometrycznie — punkty mają współrzędne,
  // a dystrykty własne poligony (podział INE nie pokrywa się z podziałem OSM).
  for (const f of areas) {
    const code = f.properties?.code as string;
    const inside = places.features.filter(
      (pl) => pointInGeometry((pl.geometry as GeoJSON.Point).coordinates as [number, number], f.geometry),
    );
    placesByDistrict.set(
      code,
      inside.map((pl) => ({
        name: pl.properties?.name as string,
        category: pl.properties?.category as string,
      })),
    );
  }

  // Percepcja po nazwie dzielnicy — istnieje tylko dla Bilbao.
  const perceptionByName = new Map(
    data.districts.features.map((f) => [
      f.properties?.name as string,
      f.properties?.perception as number | null,
    ]),
  );

  const openDistrict = (code: string) => {
    const f = districtByCode.get(code);
    if (!f) return;
    const p = f.properties ?? {};
    const muni = data.safety[p.city as string];
    const view: AreaView = {
      name: p.name as string,
      income: (p.income as number) ?? null,
      incomePrev: (p.income_prev as number) ?? null,
      incomeYear: (p.income_year as number) ?? null,
      cityName: p.cityName as string,
      crimeRate: muni?.crime_rate ?? null,
      crimePeriod: muni?.crime_period ?? null,
      crimeChangePct: muni?.crime_change_pct ?? null,
      perception: perceptionByName.get(p.name as string) ?? null,
      perceptionYear: 2025,
    };
    showArea(el("sidebar"), view, placesByDistrict.get(code) ?? [], data.reference);
  };

  const categories = [
    ...new Set(places.features.map((f) => f.properties?.category as string)),
  ].filter(Boolean);

  // Warstwy mapy zależą od WebGL/stylu — dołączamy je, gdy mapa jest gotowa.
  // Kontroler filtra kategorii jest dostępny dopiero po dodaniu warstwy.
  let setCategories: ((active: Set<string>) => void) | undefined;
  const addLayers = () => {
    addAreaLayers(map, data.ineDistricts, openDistrict);
    setCategories = addPlacesLayer(map, places).setActiveCategories;
    // Etykiety na sam wierzch: klastry miejsc są nieprzezroczystymi kołami
    // rysowanymi później i zasłaniały nazwy gmin.
    map.moveLayer("areas-label");
  };
  if (map.isStyleLoaded()) addLayers();
  else map.once("load", addLayers);

  // --- UI renderujemy NATYCHMIAST po danych (niezależnie od gotowości mapy) ---
  const missing = areas.filter((f) => f.properties?.income == null).length;
  const drawLegend = () => {
    renderLegend(el("legend"), categories, { missing, total: areas.length });
    el("legend").querySelector("#methodology-btn")?.addEventListener("click", openMethodology);
  };
  drawLegend();

  const active = new Set(categories);
  const items: FilterItem[] = categories.map((c) => ({
    id: c,
    label: CATEGORY_LABELS[c] ?? c,
    color: CATEGORY_COLORS[c],
    checked: true,
  }));
  renderFilters(el("filters"), items, (id, visible) => {
    if (visible) active.add(id);
    else active.delete(id);
    setCategories?.(active);
  });

  el("loading")?.remove();

  // Badge mówi, ILE obszarów nie ma danych dla domyślnej metryki. Brak pomiaru
  // musi być widoczny od razu, a nie dopiero po kliknięciu w obszar.
  if (data.geometryPlaceholder) {
    const badge = document.createElement("div");
    badge.className = "demo-badge";
    badge.textContent = "⚠ Dane demonstracyjne (placeholder)";
    badge.title = "Uruchom `npm run etl`, aby wgrać realne dane z OpenStreetMap";
    document.getElementById("app")?.appendChild(badge);
  }

  renderControls(
    el("controls"),
    areas.map((f) => ({
      code: f.properties?.code as string,
      name: labelOf(f),
    })),
    (code) => {
      const feature = districtByCode.get(code);
      if (feature?.geometry) map.fitBounds(bounds(feature.geometry), { padding: 60, maxZoom: 14 });
      openDistrict(code);
    },
  );
}

bootstrap().catch((err) => {
  console.error(err);
  el("loading")?.remove();
  el("map").innerHTML = `<div class="error">Błąd ładowania danych: ${err.message}</div>`;
});
