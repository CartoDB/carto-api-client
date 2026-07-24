// Fill-pattern atlas — internal to carto-api-client.
//
// The patterns live as individual, developer-editable 64x64 pixel-art tiles
// (src/fetch-map/patterns/*.png), inlined by tsup's `dataurl` loader and composited into
// a sprite sheet on a canvas the first time a pattern is needed. Tiles are upscaled to
// the atlas cell size with nearest-neighbor (smoothing off), so each art pixel spans
// several texels and deck.gl's default linear sampling keeps edges crisp while line
// spacing stays even at fractional zoom ratios.
//
// parse-map sets `result.fillPatternAtlas = getPatternAtlas()`. deck.gl's
// `fillPatternAtlas` prop is async — but the Promise must resolve to a decoded image,
// never a data-URL string: deck URL-loads string prop values, while a promise-resolved
// string goes straight to texture creation, where luma.gl rejects it.
//
// Debug knobs (set in the browser console, then reload the map):
//   globalThis.__CARTO_PATTERN_CELL_SIZE__ = 64|128|256   // atlas cell px, default 128
//   globalThis.__CARTO_PATTERN_TEXTURE_PARAMS__ = {magFilter: 'nearest', ...}
//     // merged into the atlas texture's sampler via deck's `textureParameters`;
//     // unset -> deck defaults (linear).

import hlinesLarge from './patterns/hlines-large.png';
import hlinesMedium from './patterns/hlines-medium.png';
import hlinesSmall from './patterns/hlines-small.png';
import vlinesLarge from './patterns/vlines-large.png';
import vlinesMedium from './patterns/vlines-medium.png';
import vlinesSmall from './patterns/vlines-small.png';
import diagLeftLarge from './patterns/diag-left-large.png';
import diagLeftMedium from './patterns/diag-left-medium.png';
import diagLeftSmall from './patterns/diag-left-small.png';
import diagRightLarge from './patterns/diag-right-large.png';
import diagRightMedium from './patterns/diag-right-medium.png';
import diagRightSmall from './patterns/diag-right-small.png';
import crossHatchLarge from './patterns/cross-hatch-large.png';
import crossHatchMedium from './patterns/cross-hatch-medium.png';
import crossHatchSmall from './patterns/cross-hatch-small.png';
import dotsLarge from './patterns/dots-large.png';
import dotsMedium from './patterns/dots-medium.png';
import dotsSmall from './patterns/dots-small.png';
import checkerLarge from './patterns/checker-large.png';
import checkerMedium from './patterns/checker-medium.png';
import checkerSmall from './patterns/checker-small.png';
import solid from './patterns/solid.png';

const DEFAULT_CELL_SIZE = 128;

type PatternDebugGlobals = {
  __CARTO_PATTERN_CELL_SIZE__?: number;
  __CARTO_PATTERN_TEXTURE_PARAMS__?: Record<string, unknown>;
};

export type PatternAtlasFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  mask: boolean;
};

// Atlas grid: rows follow PATTERN_ROWS, columns are density sparse->dense
// [large, medium, small]; last row holds `none` (transparent) and `solid`.
const PATTERN_ROWS = [
  'hlines',
  'vlines',
  'diag-left',
  'diag-right',
  'cross-hatch',
  'dots',
  'checker',
] as const;
const DENSITY_COLUMNS = ['large', 'medium', 'small'] as const;

// atlas key -> inlined data URL of its editable source tile
const CELL_URLS: Record<string, string> = {
  'hlines-large': hlinesLarge,
  'hlines-medium': hlinesMedium,
  'hlines-small': hlinesSmall,
  'vlines-large': vlinesLarge,
  'vlines-medium': vlinesMedium,
  'vlines-small': vlinesSmall,
  'diag-left-large': diagLeftLarge,
  'diag-left-medium': diagLeftMedium,
  'diag-left-small': diagLeftSmall,
  'diag-right-large': diagRightLarge,
  'diag-right-medium': diagRightMedium,
  'diag-right-small': diagRightSmall,
  'cross-hatch-large': crossHatchLarge,
  'cross-hatch-medium': crossHatchMedium,
  'cross-hatch-small': crossHatchSmall,
  'dots-large': dotsLarge,
  'dots-medium': dotsMedium,
  'dots-small': dotsSmall,
  'checker-large': checkerLarge,
  'checker-medium': checkerMedium,
  'checker-small': checkerSmall,
  solid,
};

function debugGlobals(): PatternDebugGlobals {
  return globalThis as PatternDebugGlobals;
}

export function getPatternCellSize(): number {
  const cell = debugGlobals().__CARTO_PATTERN_CELL_SIZE__;
  return typeof cell === 'number' && cell > 0 ? cell : DEFAULT_CELL_SIZE;
}

/** Sampler overrides for the atlas texture; undefined keeps deck's defaults (linear). */
export function getPatternTextureParameters():
  | Record<string, unknown>
  | undefined {
  const params = debugGlobals().__CARTO_PATTERN_TEXTURE_PARAMS__;
  return params && typeof params === 'object' ? params : undefined;
}

export function getPatternAtlasMapping(
  cell: number = getPatternCellSize()
): Record<string, PatternAtlasFrame> {
  const mapping: Record<string, PatternAtlasFrame> = {};
  const frame = (col: number, row: number): PatternAtlasFrame => ({
    x: col * cell,
    y: row * cell,
    width: cell,
    height: cell,
    mask: true,
  });
  PATTERN_ROWS.forEach((pattern, row) => {
    DENSITY_COLUMNS.forEach((density, col) => {
      mapping[`${pattern}-${density}`] = frame(col, row);
    });
  });
  // `none` must be a real transparent cell — a null pattern key resolves to atlas
  // bounds [0,0,0,0] and samples the wrong (0,0) cell.
  mapping.none = frame(0, PATTERN_ROWS.length);
  mapping.solid = frame(1, PATTERN_ROWS.length);
  return mapping;
}

export type AssembledAtlas = ImageBitmap | HTMLCanvasElement;

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

function createCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  throw new Error(
    'carto-api-client: no Canvas available to assemble the pattern atlas'
  );
}

async function loadImage(dataUrl: string): Promise<CanvasImageSource> {
  if (
    typeof createImageBitmap !== 'undefined' &&
    typeof fetch !== 'undefined'
  ) {
    const blob = await (await fetch(dataUrl)).blob();
    return createImageBitmap(blob);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

const atlasPromises = new Map<number, Promise<AssembledAtlas>>();

/** Assemble the sprite sheet from the individual editable pattern tiles. Memoized. */
export function getPatternAtlas(
  cell: number = getPatternCellSize()
): Promise<AssembledAtlas> {
  let promise = atlasPromises.get(cell);
  if (!promise) {
    promise = build(cell);
    // Keep a rejection observed even if no consumer attaches a handler (e.g. Node,
    // where there is no canvas) — the returned promise still rejects for real callers.
    promise.catch(() => {});
    atlasPromises.set(cell, promise);
  }
  return promise;
}

async function build(cell: number): Promise<AssembledAtlas> {
  const mapping = getPatternAtlasMapping(cell);
  const canvas = createCanvas(cell * 3, cell * (PATTERN_ROWS.length + 1));
  const ctx = canvas.getContext('2d');
  if (!ctx)
    throw new Error(
      'carto-api-client: 2D context unavailable for pattern atlas'
    );

  const images: Record<string, CanvasImageSource> = {};
  await Promise.all(
    Object.entries(CELL_URLS).map(async ([key, url]) => {
      images[key] = await loadImage(url);
    })
  );

  // Nearest-neighbor upscale of each pixel-art tile to its cell; `none` is left
  // transparent (no tile).
  ctx.imageSmoothingEnabled = false;
  for (const [key, frame] of Object.entries(mapping)) {
    const img = images[key];
    if (img) ctx.drawImage(img, frame.x, frame.y, cell, cell);
  }

  if (typeof createImageBitmap !== 'undefined')
    return createImageBitmap(canvas);
  return canvas as HTMLCanvasElement;
}
