import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";

import { createMap } from "./map";
import { loadAllData } from "./data/loader";
import { addDistrictLayers } from "./layers/districts";
import { addPointLayer, setPointLayerVisibility } from "./layers/points";
import { renderLegend } from "./ui/legend";
import { showDistrict } from "./ui/sidebar";
import { renderFilters } from "./ui/filters";

const el = (id: string) => document.getElementById(id) as HTMLElement;

async function bootstrap(): Promise<void> {
  const map = createMap("map");

  // Dane i mapa ładują się równolegle; łączymy po 'load'.
  const [data] = await Promise.all([
    loadAllData(),
    new Promise<void>((resolve) => map.on("load", () => resolve())),
  ]);

  const nameByCode = new Map<string, string>(
    data.districts.features.map((f) => [
      f.properties?.code as string,
      f.properties?.name as string,
    ]),
  );

  addDistrictLayers(map, data.districts, (code) => {
    showDistrict(el("sidebar"), code, nameByCode.get(code) ?? code, data.safety);
  });

  addPointLayer(map, "poi", data.poi);
  addPointLayer(map, "activities", data.activities);

  renderLegend(el("legend"));

  renderFilters(
    el("filters"),
    [
      { id: "poi", label: "Miejsca warte zobaczenia", color: "#c0392b", checked: true },
      { id: "activities", label: "Aktywności", color: "#2b7bba", checked: true },
    ],
    (id, visible) => setPointLayerVisibility(map, id, visible),
  );
}

bootstrap().catch((err) => {
  console.error(err);
  el("map").innerHTML = `<div class="error">Błąd ładowania danych: ${err.message}</div>`;
});
