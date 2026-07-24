// Fill-pattern atlas — internal to carto-api-client.
//
// parse-map sets `result.fillPatternAtlas = getPatternAtlas()`. deck.gl's
// `fillPatternAtlas` prop is async, so it accepts either the baked data-URL string or a
// Promise of the runtime-assembled sheet (a decoded image — deck URL-loads string prop
// values but not promise-resolved strings) — the consumer just spreads `descriptor.props`
// and never sees this choice.
//
// PoC switch: set `globalThis.__CARTO_RUNTIME_ATLAS__ = true` (e.g. in the browser
// console) and reload the map to A/B the runtime-assembled atlas against the baked one.

import {BAKED_ATLAS_URL, PATTERN_ATLAS_MAPPING} from './pattern-atlas-baked.js';
import {
  assemblePatternAtlas,
  type AssembledAtlas,
} from './pattern-atlas-runtime.js';

export {PATTERN_ATLAS_MAPPING};

export function getPatternAtlas(): string | Promise<AssembledAtlas> {
  const runtime =
    (globalThis as {__CARTO_RUNTIME_ATLAS__?: boolean})
      .__CARTO_RUNTIME_ATLAS__ === true;
  return runtime ? assemblePatternAtlas() : BAKED_ATLAS_URL;
}
