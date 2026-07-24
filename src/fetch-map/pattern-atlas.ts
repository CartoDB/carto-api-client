// Fill-pattern atlas — internal to carto-api-client.
//
// The patterns live as individual, developer-editable tiles (src/fetch-map/patterns/):
// Design's original 64px raster masks (*.png) plus vector twins (*.svg), both inlined
// by tsup's `dataurl` loader, with procedural canvas painters as a third, asset-free
// source — selectable via a debug knob while the final asset strategy is evaluated.
// Tiles are composited into a sprite sheet on a canvas the first time a pattern is
// needed. Each atlas cell is filled with side-by-side copies of its tile (raster art
// never resampled), and is surrounded by a gutter holding the tile's own wrapped
// content — so linear sampling stays seamless at repeat boundaries and never bleeds a
// neighboring cell.
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
//   globalThis.__CARTO_PATTERN_ASSET_SOURCE__ = 'png' | 'svg' | 'procedural'
//     // 'png' (default): Design's original 64px raster masks, tiled at native
//     //   resolution. 'svg': in-repo vector tiles rasterized at atlas-build time
//     //   (2x texel density per repeat). 'procedural': canvas painters, no assets.

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

import hlinesLargeSvg from './patterns/hlines-large.svg';
import hlinesMediumSvg from './patterns/hlines-medium.svg';
import hlinesSmallSvg from './patterns/hlines-small.svg';
import vlinesLargeSvg from './patterns/vlines-large.svg';
import vlinesMediumSvg from './patterns/vlines-medium.svg';
import vlinesSmallSvg from './patterns/vlines-small.svg';
import diagLeftLargeSvg from './patterns/diag-left-large.svg';
import diagLeftMediumSvg from './patterns/diag-left-medium.svg';
import diagLeftSmallSvg from './patterns/diag-left-small.svg';
import diagRightLargeSvg from './patterns/diag-right-large.svg';
import diagRightMediumSvg from './patterns/diag-right-medium.svg';
import diagRightSmallSvg from './patterns/diag-right-small.svg';
import crossHatchLargeSvg from './patterns/cross-hatch-large.svg';
import crossHatchMediumSvg from './patterns/cross-hatch-medium.svg';
import crossHatchSmallSvg from './patterns/cross-hatch-small.svg';
import dotsLargeSvg from './patterns/dots-large.svg';
import dotsMediumSvg from './patterns/dots-medium.svg';
import dotsSmallSvg from './patterns/dots-small.svg';
import checkerLargeSvg from './patterns/checker-large.svg';
import checkerMediumSvg from './patterns/checker-medium.svg';
import checkerSmallSvg from './patterns/checker-small.svg';
import solidSvg from './patterns/solid.svg';

const DEFAULT_CELL_SIZE = 128;
// px of the original raster masks; also the design grid the on-screen size is
// defined against — one tile spans 64 design units whatever the asset source.
const SOURCE_TILE_SIZE = 64;
// Vector sources (svg/procedural) rasterize each repeat at up to this many px,
// doubling texel density per repeat vs the 64px masks.
const VECTOR_RENDER_SIZE = 128;

export type PatternAssetSource = 'png' | 'svg' | 'procedural';

type PatternDebugGlobals = {
  __CARTO_PATTERN_CELL_SIZE__?: number;
  __CARTO_PATTERN_TEXTURE_PARAMS__?: Record<string, unknown>;
  __CARTO_PATTERN_ASSET_SOURCE__?: PatternAssetSource;
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

// atlas key -> inlined data URL of its vector source tile
const CELL_SVG_URLS: Record<string, string> = {
  'hlines-large': hlinesLargeSvg,
  'hlines-medium': hlinesMediumSvg,
  'hlines-small': hlinesSmallSvg,
  'vlines-large': vlinesLargeSvg,
  'vlines-medium': vlinesMediumSvg,
  'vlines-small': vlinesSmallSvg,
  'diag-left-large': diagLeftLargeSvg,
  'diag-left-medium': diagLeftMediumSvg,
  'diag-left-small': diagLeftSmallSvg,
  'diag-right-large': diagRightLargeSvg,
  'diag-right-medium': diagRightMediumSvg,
  'diag-right-small': diagRightSmallSvg,
  'cross-hatch-large': crossHatchLargeSvg,
  'cross-hatch-medium': crossHatchMediumSvg,
  'cross-hatch-small': crossHatchSmallSvg,
  'dots-large': dotsLargeSvg,
  'dots-medium': dotsMediumSvg,
  'dots-small': dotsSmallSvg,
  'checker-large': checkerLargeSvg,
  'checker-medium': checkerMediumSvg,
  'checker-small': checkerSmallSvg,
  solid: solidSvg,
};

function debugGlobals(): PatternDebugGlobals {
  return globalThis as PatternDebugGlobals;
}

export function getPatternCellSize(): number {
  const cell = debugGlobals().__CARTO_PATTERN_CELL_SIZE__;
  return typeof cell === 'number' && cell > 0 ? cell : DEFAULT_CELL_SIZE;
}

export function getPatternAssetSource(): PatternAssetSource {
  const source = debugGlobals().__CARTO_PATTERN_ASSET_SOURCE__;
  return source === 'svg' || source === 'procedural' ? source : 'png';
}

/** Sampler overrides for the atlas texture; undefined keeps deck's defaults (linear). */
export function getPatternTextureParameters():
  | Record<string, unknown>
  | undefined {
  const params = debugGlobals().__CARTO_PATTERN_TEXTURE_PARAMS__;
  return params && typeof params === 'object' ? params : undefined;
}

// Copies of the source tile laid side by side inside one atlas cell, per axis. Raster
// tiles draw at native resolution (no resampling); vector sources rasterize each
// repeat at up to VECTOR_RENDER_SIZE px. The UV wrap — where sampling seams live —
// happens 1/reps as often.
function getPatternRepeats(
  cell: number,
  source: PatternAssetSource = getPatternAssetSource()
): number {
  const repeatSize = source === 'png' ? SOURCE_TILE_SIZE : VECTOR_RENDER_SIZE;
  return Math.max(1, Math.floor(cell / repeatSize));
}

// deck's fill-pattern shader sizes the on-screen repeat proportionally to the mapping
// frame's texel size (scale = FILL_UV_SCALE * getFillPatternScale * frame.wh). This
// factor compensates for the cell size and the repeats inside it, normalized to the
// 64px design grid, so the pattern keeps a constant on-screen size across cell sizes
// and asset sources.
export function getPatternScaleAdjustment(
  cell: number = getPatternCellSize()
): number {
  return (SOURCE_TILE_SIZE * getPatternRepeats(cell)) / cell;
}

// Gutter width around each cell; sized so a few mip levels stay bleed-free.
function getPatternCellPadding(cell: number): number {
  return Math.max(2, Math.round(cell / 16));
}

export function getPatternAtlasMapping(
  cell: number = getPatternCellSize()
): Record<string, PatternAtlasFrame> {
  const pad = getPatternCellPadding(cell);
  const pitch = cell + 2 * pad;
  const mapping: Record<string, PatternAtlasFrame> = {};
  const frame = (col: number, row: number): PatternAtlasFrame => ({
    x: pad + col * pitch,
    y: pad + row * pitch,
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

// SVG images always go through an Image element: createImageBitmap on SVG blobs is
// inconsistent across engines, and drawImage from an SVG image rasterizes from the
// vector at the destination size in modern browsers.
function loadSvgImage(dataUrl: string): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Procedural painters — the same measured design-grid geometry as the assets, drawn
// in 64-unit design coordinates onto a pre-scaled context (canvas AA does the rest).
const DENSITY_STEP: Record<string, number> = {small: 1, medium: 2, large: 4};

function paintDesignTile(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  key: string
): void {
  const [, name, density] =
    key.match(/^(.*?)(?:-(small|medium|large))?$/) ?? [];
  const step = DENSITY_STEP[density ?? ''] ?? 1;
  const linePeriod = 4 * step;
  const diagPeriod = 16 * step;
  const square = 2 * step;
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  const diag = (dir: 1 | -1) => {
    // dir 1: "\" lines (x - y = k*p); dir -1: "/" lines (x + y = k*p)
    ctx.lineWidth = Math.SQRT2; // 2px horizontal width at 45 degrees
    ctx.beginPath();
    for (
      let k = -Math.ceil(64 / diagPeriod);
      k <= 2 * Math.ceil(64 / diagPeriod);
      k++
    ) {
      ctx.moveTo(k * diagPeriod - 8 * dir, -8);
      ctx.lineTo(k * diagPeriod + 72 * dir, 72);
    }
    ctx.stroke();
  };
  switch (name) {
    case 'solid':
      ctx.fillRect(0, 0, 64, 64);
      break;
    case 'hlines':
      for (let y = 0; y < 64; y += linePeriod) ctx.fillRect(0, y, 64, 2);
      break;
    case 'vlines':
      for (let x = 0; x < 64; x += linePeriod) ctx.fillRect(x, 0, 2, 64);
      break;
    case 'dots':
      for (let y = 0; y < 64; y += linePeriod)
        for (let x = 0; x < 64; x += linePeriod) ctx.fillRect(x, y, 2, 2);
      break;
    case 'checker':
      for (let j = 0; j * square < 64; j++)
        for (let i = 0; i * square < 64; i++)
          if ((i + j) % 2 === 0)
            ctx.fillRect(i * square, j * square, square, square);
      break;
    case 'diag-left':
      diag(1);
      break;
    case 'diag-right':
      diag(-1);
      break;
    case 'cross-hatch':
      diag(1);
      diag(-1);
      break;
  }
}

function paintTileCanvas(key: string, size: number): CanvasImageSource {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx)
    throw new Error(
      'carto-api-client: 2D context unavailable for pattern tile'
    );
  ctx.scale(size / 64, size / 64);
  paintDesignTile(ctx, key);
  return canvas;
}

type TileImages = Record<string, CanvasImageSource>;

// Shared compositor: lay out the per-key tile images on the atlas grid. `none` is
// left transparent (no tile). Every other cell is filled with reps x reps copies of
// its tile, with one extra ring clipped into the gutter, so the padding holds the
// tile's own wrapped content.
async function composeAtlas(
  cell: number,
  reps: number,
  images: TileImages
): Promise<AssembledAtlas> {
  const mapping = getPatternAtlasMapping(cell);
  const pad = getPatternCellPadding(cell);
  const pitch = cell + 2 * pad;
  const step = cell / reps;
  const canvas = createCanvas(pitch * 3, pitch * (PATTERN_ROWS.length + 1));
  const ctx = canvas.getContext('2d');
  if (!ctx)
    throw new Error(
      'carto-api-client: 2D context unavailable for pattern atlas'
    );

  for (const [key, frame] of Object.entries(mapping)) {
    const img = images[key];
    if (!img) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(frame.x - pad, frame.y - pad, cell + 2 * pad, cell + 2 * pad);
    ctx.clip();
    for (let i = -1; i <= reps; i++) {
      for (let j = -1; j <= reps; j++) {
        ctx.drawImage(img, frame.x + i * step, frame.y + j * step, step, step);
      }
    }
    ctx.restore();
  }

  if (typeof createImageBitmap !== 'undefined')
    return createImageBitmap(canvas);
  return canvas as HTMLCanvasElement;
}

// One builder per asset source, all funneling into composeAtlas.

// Design's original 64px raster masks, tiled at native resolution (never resampled).
async function buildPngAtlas(cell: number): Promise<AssembledAtlas> {
  const images: TileImages = {};
  await Promise.all(
    Object.entries(CELL_URLS).map(async ([key, url]) => {
      images[key] = await loadImage(url);
    })
  );
  return composeAtlas(cell, getPatternRepeats(cell, 'png'), images);
}

// In-repo vector tiles, rasterized from the vector at the repeat size.
async function buildSvgAtlas(cell: number): Promise<AssembledAtlas> {
  const images: TileImages = {};
  await Promise.all(
    Object.entries(CELL_SVG_URLS).map(async ([key, url]) => {
      images[key] = await loadSvgImage(url);
    })
  );
  return composeAtlas(cell, getPatternRepeats(cell, 'svg'), images);
}

// Asset-free canvas painters drawing the measured design-grid geometry.
async function buildProceduralAtlas(cell: number): Promise<AssembledAtlas> {
  const reps = getPatternRepeats(cell, 'procedural');
  const step = cell / reps;
  const images: TileImages = {};
  for (const key of Object.keys(CELL_URLS)) {
    images[key] = paintTileCanvas(key, step);
  }
  return composeAtlas(cell, reps, images);
}

const ATLAS_BUILDERS: Record<
  PatternAssetSource,
  (cell: number) => Promise<AssembledAtlas>
> = {
  png: buildPngAtlas,
  svg: buildSvgAtlas,
  procedural: buildProceduralAtlas,
};

const atlasPromises = new Map<string, Promise<AssembledAtlas>>();

/** Assemble the sprite sheet for the active asset source and cell size. Memoized. */
export function getPatternAtlas(
  cell: number = getPatternCellSize()
): Promise<AssembledAtlas> {
  const source = getPatternAssetSource();
  const memoKey = `${source}:${cell}`;
  let promise = atlasPromises.get(memoKey);
  if (!promise) {
    promise = ATLAS_BUILDERS[source](cell);
    // Keep a rejection observed even if no consumer attaches a handler (e.g. Node,
    // where there is no canvas) — the returned promise still rejects for real callers.
    promise.catch(() => {});
    atlasPromises.set(memoKey, promise);
  }
  return promise;
}
