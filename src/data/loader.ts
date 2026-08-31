import { DATA } from "../config";
import { joinSafety } from "./join";

export interface SafetyRecord {
  safety_index: number;
  day_score: number;
  night_score: number;
  incidents_per_1k: number;
  trend: "up" | "flat" | "down";
  summary: string;
}

export type SafetyMap = Record<string, SafetyRecord>;

export interface LoadedData {
  districts: GeoJSON.FeatureCollection;
  safety: SafetyMap;
  activities: GeoJSON.FeatureCollection;
  poi: GeoJSON.FeatureCollection;
  /**
   * Czy GEOMETRIA dzielnic to placeholder. Znika po `npm run etl`, bo granice
   * pochodzą wtedy wprost z OSM.
   */
  geometryPlaceholder: boolean;
  /**
   * Czy WSKAŹNIKI BEZPIECZEŃSTWA są szacunkowe. Niezależne od geometrii: ETL
   * pobiera granice z OSM, ale statystyk przestępczości w OSM nie ma, więc
   * `safety.json` zostaje szacunkowy aż ktoś wgra realne dane (patrz
   * docs/SAFETY_METHODOLOGY.md). Rozdzielenie tych dwóch flag jest istotne —
   * wcześniej ostrzeżenie znikało po ETL razem z placeholderową geometrią,
   * przez co zmyślone indeksy prezentowały się jak dane rzeczywiste.
   */
  safetyPlaceholder: boolean;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nie udało się pobrać ${url}: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Ładuje wszystkie zbiory danych równolegle i dołącza metryki bezpieczeństwa
 * do właściwości featerów dzielnic (join po polu `code`).
 */
export async function loadAllData(): Promise<LoadedData> {
  const [districts, safety, activities, poi] = await Promise.all([
    fetchJSON<GeoJSON.FeatureCollection>(DATA.districts),
    fetchJSON<SafetyMap>(DATA.safety),
    fetchJSON<GeoJSON.FeatureCollection>(DATA.activities),
    fetchJSON<GeoJSON.FeatureCollection>(DATA.poi),
  ]);

  const geometryPlaceholder = Boolean(
    (districts as { meta?: { placeholder?: boolean } }).meta?.placeholder,
  );
  const safetyPlaceholder = Boolean((safety as { _placeholder?: boolean })._placeholder);
  return {
    districts: joinSafety(districts, safety),
    safety,
    activities,
    poi,
    geometryPlaceholder,
    safetyPlaceholder,
  };
}
