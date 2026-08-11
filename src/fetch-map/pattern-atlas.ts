// Fill-pattern atlas — internal to carto-api-client.
//
// Pattern tiles live as individual, developer-editable assets under
// src/fetch-map/patterns/ — the Figma vector export (*.svg), inlined as data URLs by
// tsup's `dataurl` loader. Tiles are composited into a sprite sheet on a canvas the first
// time an atlas is requested; each cell packs floor(size/64) copies of its tile, every
// copy rasterized at 64 × resolution texels, surrounded by a gutter carrying the tile's
// own wrapped content so linear sampling stays seamless at repeat boundaries and never
// bleeds a neighbouring cell.
//
// The atlas is a pure function of `buildPatternAtlas`'s options — no ambient config.
// Callers own scale/zoom behaviour: this module never adapts the pattern to zoom, and
// knows nothing about the shader extensions (seam/fp64) Builder layers on top.
//
// deck.gl's `fillPatternAtlas` prop is async — but the Promise must resolve to a decoded
// image, never a data-URL string: deck URL-loads string prop values, while a
// promise-resolved string goes straight to texture creation, where luma.gl rejects it.

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

// Native period of every tile — the figma svg viewBox spans 64 units. The atlas packs
// `floor(size/64)` copies per cell (see composeAtlas); the texel budget from `resolution`
// goes into rasterizing each copy denser, never into more copies.
const SOURCE_TILE_SIZE = 64;
// CSS/logical cell size — the on-screen reference. Drives on-screen pattern size.
const DEFAULT_SIZE = 64;
// Texel-density multiplier: actual atlas cell = size × resolution, and every tile copy is
// rasterized from its svg at `resolution` × its native 64 px (sharper, same on-screen size).
const DEFAULT_RESOLUTION = 4;
// Mip depth for the atlas. Zoomed-out moiré is texture minification aliasing, so mipmaps
// stay on: the emitted `lodMaxClamp` equals this, and the cell gutter (bleeding buffer) is
// sized to 2^mipLevels texels so a level-L average near a cell edge never reaches into the
// neighbour. 2 is the crispness/moiré sweet spot — deeper levels over-blur and anisotropy
// covers the rest. Raise it to sample deeper; the gutter and `lodMaxClamp` grow with it.
const DEFAULT_MIP_LEVELS = 2;

// Anisotropic taps for the atlas sampler — oriented multi-tap that suppresses minification
// moiré on tilted views with far less crispness loss than a deeper mip. Only costs when the
// footprint is elongated (grazing angle), ~free flat; 4 is the sweet spot.
const DEFAULT_MAX_ANISOTROPY = 4;

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

// atlas key -> inlined data URL of its editable source tile (Figma vector export)
const CELL_URLS: Record<string, string> = {
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

export type PatternAtlasOptions = {
  /** CSS/logical cell size — the on-screen reference. Default 64. */
  size?: number;
  /** Texel-density multiplier; actual atlas cell = size × resolution, each tile copy
   *  rasterized at `resolution` × its native 64 px. Default 4. */
  resolution?: number;
  /** Mip levels the margin is sized to keep bleed-free; also the `lodMaxClamp` to cap the
   *  sampler at. Default 2. */
  mipLevels?: number;
};

type ResolvedOptions = {
  size: number;
  resolution: number;
  mipLevels: number;
  /** Actual atlas cell in texels: size × resolution. */
  cell: number;
};

function resolveOptions(options: PatternAtlasOptions = {}): ResolvedOptions {
  const size =
    typeof options.size === 'number' && options.size > 0
      ? Math.round(options.size)
      : DEFAULT_SIZE;
  const resolution =
    typeof options.resolution === 'number' && options.resolution > 0
      ? options.resolution
      : DEFAULT_RESOLUTION;
  const mipLevels =
    typeof options.mipLevels === 'number' && options.mipLevels >= 0
      ? Math.floor(options.mipLevels)
      : DEFAULT_MIP_LEVELS;
  return {
    size,
    resolution,
    mipLevels,
    cell: Math.round(size * resolution),
  };
}

// Copies of the native tile packed per axis inside one cell. Derived from the logical
// `size`, NOT the texel cell: deriving from the cell would convert the whole resolution
// budget into extra 1×-density copies (each drawn at cell/reps = 64 px), silently
// cancelling `resolution` — each copy must instead rasterize at 64 × resolution texels.
function repeatsFor({size}: ResolvedOptions): number {
  return Math.max(1, Math.floor(size / SOURCE_TILE_SIZE));
}

// deck sizes the on-screen repeat as FILL_UV_SCALE × getFillPatternScale × frame.wh (the
// whole cell). With `reps` tiles packed in the cell, this factor keeps each tile at a
// constant SOURCE_TILE_SIZE on-screen footprint independent of cell size / resolution.
function scaleAdjustmentFor(opts: ResolvedOptions): number {
  return (SOURCE_TILE_SIZE * repeatsFor(opts)) / opts.cell;
}

// Margin (bleeding buffer) width around each cell, filled with the cell's own wrapped
// pattern by composeAtlas. Sized as 2^N atlas texels to keep N mip levels bleed-free,
// capped at cell/4 so the atlas doesn't balloon for small cells.
function cellPadding(cell: number, mipLevels: number): number {
  return Math.max(2, Math.min(1 << mipLevels, Math.round(cell / 4)));
}

function getAtlasMapping({
  cell,
  mipLevels,
}: ResolvedOptions): Record<string, PatternAtlasFrame> {
  const pad = cellPadding(cell, mipLevels);
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

// SVG images always go through an Image element: createImageBitmap on SVG blobs is
// inconsistent across engines, and drawImage from an SVG image rasterizes from the
// vector at the destination size in modern browsers.
function loadSvg(dataUrl: string): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

type TileImages = Record<string, CanvasImageSource>;

// Composite the tiles onto the atlas grid. `none` is left transparent (no tile). Every
// other cell is filled with reps×reps native-size copies of its tile, plus enough extra
// rings clipped into the gutter that the padding always holds the tile's own wrapped
// content — so linear sampling stays seamless at repeat boundaries.
async function composeAtlas(
  opts: ResolvedOptions,
  images: TileImages
): Promise<AssembledAtlas> {
  const {cell, mipLevels} = opts;
  const mapping = getAtlasMapping(opts);
  const pad = cellPadding(cell, mipLevels);
  const pitch = cell + 2 * pad;
  const reps = repeatsFor(opts);
  // Each copy draws at 64 × resolution texels — SVG rasterizes at the destination size,
  // so this is where the resolution budget becomes real pixel density.
  const step = cell / reps;
  const canvas = createCanvas(pitch * 3, pitch * (PATTERN_ROWS.length + 1));
  // Narrowing cast: getContext('2d') on the HTMLCanvasElement | OffscreenCanvas union
  // otherwise widens the DOM branch to the generic RenderingContext in the dts build.
  // The 2D drawing API used below is shared by both canvas kinds.
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx)
    throw new Error(
      'carto-api-client: 2D context unavailable for pattern atlas'
    );

  // `pad` may span more than one tile step, so draw enough extra rings on every side to
  // fill the whole margin with the pattern's wrapped content.
  const ext = Math.ceil(pad / step);
  for (const [key, frame] of Object.entries(mapping)) {
    const img = images[key];
    if (!img) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(frame.x - pad, frame.y - pad, cell + 2 * pad, cell + 2 * pad);
    ctx.clip();
    // Workaround for deck.gl FillStyleExtension sampling the atlas vertically
    // mirrored (common-space y grows up-screen, texture v grows down-image, and the
    // shader never flips — https://github.com/visgl/deck.gl/issues/10548): compose
    // each frame flipped so the rendered fill matches the source SVG. Only the
    // direction-sensitive sprites (the diagonals) can tell. The ring region is
    // symmetric about the frame midline, so the reflection maps it onto itself and
    // the wrapped padding stays seamless. Drop this if deck fixes the orientation.
    ctx.translate(0, 2 * frame.y + cell);
    ctx.scale(1, -1);
    for (let i = -ext; i < reps + ext; i++) {
      for (let j = -ext; j < reps + ext; j++) {
        ctx.drawImage(img, frame.x + i * step, frame.y + j * step, step, step);
      }
    }
    ctx.restore();
  }

  if (typeof createImageBitmap !== 'undefined')
    return createImageBitmap(canvas);
  return canvas as HTMLCanvasElement;
}

async function assembleAtlas(opts: ResolvedOptions): Promise<AssembledAtlas> {
  const images: TileImages = {};
  await Promise.all(
    Object.entries(CELL_URLS).map(async ([key, url]) => {
      images[key] = await loadSvg(url);
    })
  );
  return composeAtlas(opts, images);
}

export type PatternAtlasBuild = {
  /** Decoded sprite sheet — memoized, safe to pass repeatedly as deck's async
   *  `fillPatternAtlas` prop. */
  atlas: Promise<AssembledAtlas>;
  /** Per-key atlas frames for deck's `fillPatternMapping`. */
  mapping: Record<string, PatternAtlasFrame>;
  /** Multiply into `getFillPatternScale` to keep on-screen size resolution-invariant. */
  scaleAdjustment: number;
  /** Resolved actual cell size in texels (size × resolution). */
  cell: number;
  /** Resolved mip depth: the gutter is sized for it and the emitted `lodMaxClamp` matches. */
  mipLevels: number;
  /** Sampler params for deck's `textureParameters`: mips on (`lodMaxClamp` = `mipLevels`)
   *  plus anisotropy for tilted views. */
  textureParameters: {lodMaxClamp: number; maxAnisotropy: number};
};

// The sprite sheet and its mapping depend on (cell, reps, mipLevels), so memoize them by
// that key — deck matches layers by prop reference, and a fresh atlas Promise each parse
// would re-trigger the texture load and blank the layer. `reps` must be in the key: two
// pairs can share a cell with different content (64@2 is one 128px-dense tile, 128@1 is
// 2×2 native copies). scaleAdjustment is cheap and computed per call.
type AtlasCore = {
  atlas: Promise<AssembledAtlas>;
  mapping: Record<string, PatternAtlasFrame>;
};
const coreCache = new Map<string, AtlasCore>();

function getAtlasCore(opts: ResolvedOptions): AtlasCore {
  const key = `${opts.cell}:${repeatsFor(opts)}:${opts.mipLevels}`;
  let core = coreCache.get(key);
  if (!core) {
    const atlas = assembleAtlas(opts);
    // Keep a rejection observed even if no consumer attaches a handler (e.g. Node, where
    // there is no canvas) — the returned promise still rejects for real callers.
    atlas.catch(() => {});
    core = {atlas, mapping: getAtlasMapping(opts)};
    coreCache.set(key, core);
  }
  return core;
}

/**
 * Assemble the fill-pattern sprite sheet for the given options. The decoded atlas and its
 * mapping are memoized by resolved atlas identity; `scaleAdjustment` reflects the caller's
 * `size`. Pure atlas production — applies no zoom/scale adaptation and knows nothing about
 * the shader extensions the caller may attach.
 */
export function buildPatternAtlas(
  options?: PatternAtlasOptions
): PatternAtlasBuild {
  const opts = resolveOptions(options);
  const {atlas, mapping} = getAtlasCore(opts);
  return {
    atlas,
    mapping,
    scaleAdjustment: scaleAdjustmentFor(opts),
    cell: opts.cell,
    mipLevels: opts.mipLevels,
    textureParameters: {
      lodMaxClamp: opts.mipLevels,
      maxAnisotropy: DEFAULT_MAX_ANISOTROPY,
    },
  };
}
