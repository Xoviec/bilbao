import maplibregl from "maplibre-gl";
import { CATEGORY_COLORS } from "./config";

// Prosty glif per kategoria (rysowany na kanwie — bez zewnętrznych zasobów).
const GLYPH: Record<string, string> = {
  green: "❦",
  sport: "⚽",
  culture: "★",
  nightlife: "☾",
  food: "▮",
  sight: "◉",
};

/** Rysuje pinezkę w kolorze kategorii i zwraca ją jako ImageData. */
function drawPin(color: string, glyph: string, size = 48): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const r = size * 0.34;

  // Kropla (pin).
  ctx.beginPath();
  ctx.arc(cx, r + 2, r, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.lineTo(cx, size - 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  // Glif w środku.
  ctx.fillStyle = "#ffffff";
  ctx.font = `${size * 0.32}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, cx, r + 2);

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Rejestruje w mapie po jednej ikonie na kategorię (`pin-<kategoria>`).
 * Wywołać po załadowaniu stylu, przed dodaniem warstwy symboli.
 */
export function registerMarkerIcons(map: maplibregl.Map): void {
  for (const [category, color] of Object.entries(CATEGORY_COLORS)) {
    const id = `pin-${category}`;
    if (map.hasImage(id)) continue;
    const img = drawPin(color, GLYPH[category] ?? "•");
    map.addImage(id, img, { pixelRatio: 2 });
  }
}
