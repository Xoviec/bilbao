import { DATA } from "../config";
import { joinSafety } from "./join";

export type Trend = "up" | "flat" | "down";

/**
 * Metryki dla jednego obszaru. Dwie NIEZALEŻNE miary, celowo nie zlane w jeden
 * indeks — mierzą co innego, pochodzą z różnych źródeł i mają różny zasięg
 * (percepcja: per dzielnica Bilbao; przestępczość: per gmina).
 */
export interface SafetyRecord {
  /** Subiektywna ocena mieszkańców, 0–10. null = nie badano tego obszaru. */
  perception: number | null;
  perception_prev: number | null;
  perception_trend: Trend;
  perception_source: string | null;
  perception_year: number | null;

  /** Przestępstwa na 1000 mieszkańców. WYŻSZA = gorzej. */
  crime_rate: number | null;
  crime_prev: number | null;
  crime_trend: Trend;
  crime_change_pct: number | null;
  /** "unit" = pomiar dla tego obszaru; "municipality" = wartość całej gminy. */
  crime_scope: "unit" | "municipality" | null;
  crime_source: string | null;
  crime_period: string | null;

  no_data_reason: string | null;
}

export interface SourceRef {
  title: string;
  publisher: string;
  method: string;
  url: string;
  scale: string;
  published?: string;
}

export interface Reference {
  name: string;
  rate: number;
  prev: number;
}

export interface CityWide {
  perception: number;
  perceptionNight: number;
  perceptionPrev: number;
  perceptionNightPrev: number;
  note: string;
}

export type SafetyMap = Record<string, SafetyRecord>;

interface SafetyFile {
  _sources: Record<string, SourceRef>;
  _cityWide: Record<string, CityWide>;
  _reference?: Reference;
  _units: SafetyMap;
}

export interface LoadedData {
  districts: GeoJSON.FeatureCollection;
  safety: SafetyMap;
  sources: Record<string, SourceRef>;
  cityWide: Record<string, CityWide>;
  /** Odniesienie (średnia prowincji) — sama stopa niewiele mówi bez punktu odniesienia. */
  reference: Reference | null;
  activities: GeoJSON.FeatureCollection;
  poi: GeoJSON.FeatureCollection;
  /** Czy GEOMETRIA obszarów to placeholder (znika po `npm run etl`). */
  geometryPlaceholder: boolean;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nie udało się pobrać ${url}: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Ładuje wszystkie zbiory równolegle i dołącza metryki do właściwości featerów
 * obszarów (join po polu `code`).
 */
export async function loadAllData(): Promise<LoadedData> {
  const [districts, safetyFile, activities, poi] = await Promise.all([
    fetchJSON<GeoJSON.FeatureCollection>(DATA.districts),
    fetchJSON<SafetyFile>(DATA.safety),
    fetchJSON<GeoJSON.FeatureCollection>(DATA.activities),
    fetchJSON<GeoJSON.FeatureCollection>(DATA.poi),
  ]);

  const safety = safetyFile._units ?? {};
  const geometryPlaceholder = Boolean(
    (districts as { meta?: { placeholder?: boolean } }).meta?.placeholder,
  );

  return {
    districts: joinSafety(districts, safety),
    safety,
    sources: safetyFile._sources ?? {},
    cityWide: safetyFile._cityWide ?? {},
    reference: safetyFile._reference ?? null,
    activities,
    poi,
    geometryPlaceholder,
  };
}
