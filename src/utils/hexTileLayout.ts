/**
 * Pointy-top hex honeycomb positions for a square tile bitmap (width === height).
 * Cell height = 2s → s = tilePx/2; horizontal pitch = √3·s, vertical = 1.5·s, odd rows shift half pitch.
 */

export type HexTilePlacement = { key: string; left: number; top: number };

export type PointyTopHexLayoutOptions = {
  /**
   * Multiplier on horizontal center-to-center spacing (√3·s).
   * Above 1 adds more space between columns; stagger stays half of scaled pitch.
   */
  horizontalPitchScale?: number;
};

export function buildPointyTopHexTileLayout(
  winW: number,
  winH: number,
  tilePx: number,
  options?: PointyTopHexLayoutOptions
): HexTilePlacement[] {
  if (tilePx <= 0 || winW <= 0 || winH <= 0) return [];

  const s = tilePx / 2;
  const hScale = options?.horizontalPitchScale ?? 1;
  const horiz = Math.sqrt(3) * s * hScale;
  const vert = 1.5 * s;
  const shift = horiz / 2;

  const positions: HexTilePlacement[] = [];
  const pad = 2;
  const rowMin = Math.floor(-tilePx / vert) - pad;
  const rowMax = Math.ceil((winH + tilePx) / vert) + pad;
  const colMin = Math.floor(-tilePx / horiz) - pad;
  const colMax = Math.ceil((winW + tilePx) / horiz) + pad;

  for (let row = rowMin; row <= rowMax; row++) {
    const stagger = ((row % 2) + 2) % 2;
    for (let col = colMin; col <= colMax; col++) {
      const cx = col * horiz + stagger * shift;
      const cy = row * vert;
      const left = cx - tilePx / 2;
      const top = cy - tilePx / 2;
      if (left > winW + tilePx || left + tilePx < -tilePx) continue;
      if (top > winH + tilePx || top + tilePx < -tilePx) continue;
      positions.push({ key: `h${row},${col}`, left, top });
    }
  }
  return positions;
}
