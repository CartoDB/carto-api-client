// Runtime fill-pattern atlas (option B / PoC).
//
// Instead of a single pre-baked sheet, ship each pattern as its own editable SVG asset
// (src/fetch-map/patterns/*.svg), let tsup inline each as a data URL (`dataurl` loader),
// and composite them into one sprite sheet on a canvas the first time a pattern is needed.
// The result is memoized and handed to deck.gl's async `fillPatternAtlas` prop as a Promise.

import hlines from './patterns/hlines.svg';
import vlines from './patterns/vlines.svg';
import diagLeft from './patterns/diag-left.svg';
import diagRight from './patterns/diag-right.svg';
import crossHatch from './patterns/cross-hatch.svg';
import dots from './patterns/dots.svg';
import checker from './patterns/checker.svg';
import solid from './patterns/solid.svg';

import {
  ATLAS_W,
  ATLAS_H,
  CELL,
  DENSITY_TILE,
  PATTERN_ATLAS_MAPPING,
} from './pattern-atlas-baked.js';

const PART_URLS: Record<string, string> = {
  hlines,
  vlines,
  'diag-left': diagLeft,
  'diag-right': diagRight,
  'cross-hatch': crossHatch,
  dots,
  checker,
  solid,
};

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

async function toDataURL(canvas: AnyCanvas): Promise<string> {
  if ('convertToBlob' in canvas) {
    const blob = await canvas.convertToBlob({type: 'image/png'});
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
  return canvas.toDataURL('image/png');
}

function splitKey(key: string): {
  pattern: string;
  density: 'large' | 'medium' | 'small';
} {
  const i = key.lastIndexOf('-');
  return {
    pattern: key.slice(0, i),
    density: key.slice(i + 1) as 'large' | 'medium' | 'small',
  };
}

let atlasPromise: Promise<string> | undefined;

/** Assemble the sprite sheet from the individual pattern assets. Memoized. */
export function assemblePatternAtlas(): Promise<string> {
  if (!atlasPromise) atlasPromise = build();
  return atlasPromise;
}

async function build(): Promise<string> {
  const canvas = createCanvas(ATLAS_W, ATLAS_H);
  const ctx = canvas.getContext('2d');
  if (!ctx)
    throw new Error(
      'carto-api-client: 2D context unavailable for pattern atlas'
    );

  const images: Record<string, CanvasImageSource> = {};
  await Promise.all(
    Object.entries(PART_URLS).map(async ([name, url]) => {
      images[name] = await loadImage(url);
    })
  );

  for (const [key, frame] of Object.entries(PATTERN_ATLAS_MAPPING)) {
    if (key === 'none') continue; // transparent cell — paint nothing
    if (key === 'solid') {
      ctx.drawImage(images.solid, frame.x, frame.y, CELL, CELL);
      continue;
    }
    const {pattern, density} = splitKey(key);
    const tile = DENSITY_TILE[density];
    const img = images[pattern];
    // Stamp the Meridian glyph across the 64px cell at the density's tile size, clipping
    // to the cell so trailing-edge stamps don't bleed into neighbours. (Meridian ships one
    // glyph per pattern with no density variants, so density here is a tiling scale.)
    ctx.save();
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, CELL, CELL);
    ctx.clip();
    for (let y = 0; y < CELL; y += tile) {
      for (let x = 0; x < CELL; x += tile) {
        ctx.drawImage(img, frame.x + x, frame.y + y, tile, tile);
      }
    }
    ctx.restore();
  }

  return toDataURL(canvas);
}
