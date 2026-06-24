import type {TileResolution} from './sources/types.js';

// Default tile display size in deck.gl, in viewport pixels. May differ
// from size or resolution assumed when generating the tile data,
const DEFAULT_TILE_SIZE = 512;

// Relative scale factor (0 = no biasing, 2 = a few hexagons cover view)
const BIAS = 2;

/**
 * Resolution conversion function. Takes a WebMercatorViewport and returns
 * a H3 resolution such that the screen space size of the hexagons is
 * "similar" to the given tileSize on screen. Intended for use with deck.gl.
 * @internal
 * @privateRemarks Source: https://github.com/visgl/deck.gl/blob/master/modules/carto/src/layers/h3-tileset-2d.ts
 */
export function _getHexagonResolution(
  viewport: {zoom: number; latitude: number},
  tileSize: number
): number {
  // Difference in given tile size compared to deck's internal 512px tile size,
  // expressed as an offset to the viewport zoom.
  const zoomOffset = Math.log2(tileSize / DEFAULT_TILE_SIZE);
  const hexagonScaleFactor = (2 / 3) * (viewport.zoom - zoomOffset);
  const latitudeScaleFactor = Math.log(
    1 / Math.cos((Math.PI * viewport.latitude) / 180)
  );

  // Clip and bias
  return Math.max(
    0,
    Math.floor(hexagonScaleFactor + latitudeScaleFactor - BIAS)
  );
}

// Default of the maps-api setting MAPS_API_V3_DYNAMIC_TILES_POINTS_AGGREGATION_LEVEL.
const DYNAMIC_TILES_POINTS_AGGREGATION_LEVEL = 8;

// Per-tileResolution correction, identical to the maps-api dynamic tiler.
const AGG_LEVEL_CORRECTION_BY_TILE_RESOLUTION: Record<TileResolution, number> =
  {
    0.25: -1,
    0.5: 0,
    1: 1,
    2: 2,
    4: 3,
  };

/**
 * Quadbin level at which the maps-api dynamic tiler implicitly aggregates a
 * point source for a given tile zoom and resolution. Lets a client reproduce
 * that level — and so the aggregation cell a point falls into — without an
 * extra round-trip to the server.
 *
 * Ported verbatim from the maps-api dynamic tiler (`getPointsAggregationLevel`).
 * The base offset mirrors the server default of
 * `MAPS_API_V3_DYNAMIC_TILES_POINTS_AGGREGATION_LEVEL`; a deployment that
 * overrides that env var drifts from this computation.
 * @internal
 */
export function getPointsAggregationLevel({
  tileResolution,
  zoomLevel,
}: {
  tileResolution: TileResolution;
  zoomLevel: number;
}): number {
  return (
    zoomLevel +
    DYNAMIC_TILES_POINTS_AGGREGATION_LEVEL +
    AGG_LEVEL_CORRECTION_BY_TILE_RESOLUTION[tileResolution]
  );
}
