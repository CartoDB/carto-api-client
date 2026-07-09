// Fill-pattern sprite atlas — option A (baked), the default.
//
// The definitive Design atlas (192x512, proper space-filling tiles) inlined as a base64
// data URL, so it ships in the bundle with no asset file and no HTTP request (hence no
// CORS surface) — the same mechanism api-client already uses for FALLBACK_ICON. deck.gl
// decodes the string and uploads the GPU texture lazily, only when a FillStyleExtension
// layer actually draws a pattern. Source of truth is the vector master (kept out of the
// repo for now) rendered to PNG; the runtime assembler (option B) remains a PoC.
//
// 7 patterns x 3 densities = 21 cells, plus a `solid` (opaque, middle of the last row)
// and a `none` (transparent) cell = 23, each 64x64. Columns are density sparse->dense
// (large/medium/small at x 0/64/128). Every cell is `mask: true`, so the sprite is a
// stencil tinted by getFillColor: opaque texels paint the fill color, transparent texels
// leave gaps. `none` must be a real transparent cell — a null pattern key resolves to
// atlas bounds [0,0,0,0] and samples the wrong (0,0) cell.
export const BAKED_ATLAS_URL =
  'data:image/png;base64,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';

export type PatternAtlasFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  mask: boolean;
};

export const PATTERN_ATLAS_MAPPING: Record<string, PatternAtlasFrame> = {
  'hlines-large': {x: 0, y: 0, width: 64, height: 64, mask: true},
  'hlines-medium': {x: 64, y: 0, width: 64, height: 64, mask: true},
  'hlines-small': {x: 128, y: 0, width: 64, height: 64, mask: true},
  'vlines-large': {x: 0, y: 64, width: 64, height: 64, mask: true},
  'vlines-medium': {x: 64, y: 64, width: 64, height: 64, mask: true},
  'vlines-small': {x: 128, y: 64, width: 64, height: 64, mask: true},
  'diag-left-large': {x: 0, y: 128, width: 64, height: 64, mask: true},
  'diag-left-medium': {x: 64, y: 128, width: 64, height: 64, mask: true},
  'diag-left-small': {x: 128, y: 128, width: 64, height: 64, mask: true},
  'diag-right-large': {x: 0, y: 192, width: 64, height: 64, mask: true},
  'diag-right-medium': {x: 64, y: 192, width: 64, height: 64, mask: true},
  'diag-right-small': {x: 128, y: 192, width: 64, height: 64, mask: true},
  'cross-hatch-large': {x: 0, y: 256, width: 64, height: 64, mask: true},
  'cross-hatch-medium': {x: 64, y: 256, width: 64, height: 64, mask: true},
  'cross-hatch-small': {x: 128, y: 256, width: 64, height: 64, mask: true},
  'dots-large': {x: 0, y: 320, width: 64, height: 64, mask: true},
  'dots-medium': {x: 64, y: 320, width: 64, height: 64, mask: true},
  'dots-small': {x: 128, y: 320, width: 64, height: 64, mask: true},
  'checker-large': {x: 0, y: 384, width: 64, height: 64, mask: true},
  'checker-medium': {x: 64, y: 384, width: 64, height: 64, mask: true},
  'checker-small': {x: 128, y: 384, width: 64, height: 64, mask: true},
  solid: {x: 64, y: 448, width: 64, height: 64, mask: true},
  none: {x: 0, y: 448, width: 64, height: 64, mask: true},
};

// Atlas geometry shared by both the baked sheet above and the runtime assembler.
export const CELL = 64;
export const ATLAS_W = CELL * 3; // 192 — columns: [large, medium, small]
export const ATLAS_H = CELL * 8; // 512 — 7 pattern rows + 1 solid/none row

// Tile size (px) the runtime assembler stamps the 16px motif at, per density.
// Larger tile = coarser pattern. Chosen to visually match the baked sheet.
export const DENSITY_TILE: Record<'large' | 'medium' | 'small', number> = {
  large: 32,
  medium: 24,
  small: 16,
};

// The 7 tileable patterns (+ solid/none handled specially by the assembler).
export const PATTERN_NAMES = [
  'hlines',
  'vlines',
  'diag-left',
  'diag-right',
  'cross-hatch',
  'dots',
  'checker',
] as const;
