// Runtime fill-pattern atlas — option B (the proposal).
//
// The patterns live as individual, developer-editable assets (src/fetch-map/patterns/*.png,
// one 64x64 space-filling tile per pattern+density) rather than a compiled base64 blob.
// tsup inlines each via its `dataurl` loader, and we composite them into the 192x512 sheet
// on a canvas the first time a pattern is needed. The result is memoized and handed to
// deck.gl's async `fillPatternAtlas` prop as a Promise (so this stays internal — the
// consumer just spreads descriptor.props). SVG-vs-PNG for the assets is a later experiment.

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

import {
  ATLAS_W,
  ATLAS_H,
  CELL,
  PATTERN_ATLAS_MAPPING,
} from './pattern-atlas-baked.js';

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

let atlasPromise: Promise<string> | undefined;

/** Assemble the sprite sheet from the individual editable pattern tiles. Memoized. */
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
    Object.entries(CELL_URLS).map(async ([key, url]) => {
      images[key] = await loadImage(url);
    })
  );

  // Place each editable 64x64 tile at its slot; `none` is left transparent (no tile).
  for (const [key, frame] of Object.entries(PATTERN_ATLAS_MAPPING)) {
    const img = images[key];
    if (img) ctx.drawImage(img, frame.x, frame.y, CELL, CELL);
  }

  return toDataURL(canvas);
}
