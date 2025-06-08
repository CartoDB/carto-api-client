import type {BBox} from 'geojson';
import type {SpatialFilter} from '../types.js';
import bboxPolygon from '@turf/bbox-polygon';
import booleanWithin from '@turf/boolean-within';
import intersect from '@turf/intersect';
import {feature, featureCollection} from '@turf/helpers';
import {TileFormat} from '../constants.js';
import {transformToTileCoords} from '../utils/transformToTileCoords.js';
import {
  cellToBoundary as quadbinCellToBoundary,
  geometryToCells as quadbinGeometryToCells,
} from 'quadbin';
import {polygonToCells as h3PolygonToCells} from 'h3-js';
import bboxClip from '@turf/bbox-clip';

// Computes intersections between spatial filters and tiles in various formats,
// for pre-filtering each tile's features before performing widget calculations.
//
// Return types:
// - true: All features in tile are within spatial filter.
// - false: No features in tile are within spatial filter; skip tile.
// - SpatialFilter/Set: Requires a more detailed per-feature check for each
//    feature in the tile. Provides a clipped spatial filter local to the tile
//    or, for spatial indexes, a set of indices ("covering set").
//
// Computing a covering set for spatial indexes may be very expensive for large
// spatial filters and small cell resolutions. For example, a viewport at z=3
// would contain ~18,000,000 raster cells at resolution=14. To avoid ever
// creating a covering set of this size, compute per-tile (not global) coverings
// when possible. For tiles fully inside or outside the spatial filter, creating
// a covering set can be skipped.
//
// H3 is currently a special case where coverage must be computed for the entire
// spatial filter; per-tile coverage would return a different result, because
// H3 child cells are not fully contained within their parents.

///////////////////////////////////////////////////////////////////////////////
// GEOMETRY

/** @internal */
export function intersectTileGeometry(
  tileBbox: BBox,
  tileFormat?: TileFormat,
  spatialFilter?: SpatialFilter
): boolean | SpatialFilter {
  const tilePolygon = bboxPolygon(tileBbox);

  if (!spatialFilter || booleanWithin(tilePolygon, spatialFilter)) {
    return true;
  }

  const clippedSpatialFilter = intersect(
    featureCollection([tilePolygon, feature(spatialFilter)])
  );

  if (!clippedSpatialFilter) {
    return false;
  }

  // Transform into local coordinates [0..1]. We assume MVT tiles use local
  // coordinates but geojson or binary features are already WGS84.
  return tileFormat === TileFormat.MVT
    ? transformToTileCoords(clippedSpatialFilter.geometry, tileBbox)
    : clippedSpatialFilter.geometry;
}

///////////////////////////////////////////////////////////////////////////////
// RASTER

/** @internal */
export function intersectTileRaster(
  parent: bigint,
  cellResolution: bigint,
  spatialFilter?: SpatialFilter
) {
  return intersectTileQuadbin(parent, cellResolution, spatialFilter);
}

///////////////////////////////////////////////////////////////////////////////
// QUADBIN

/** @internal */
export function intersectTileQuadbin(
  parent: bigint,
  cellResolution: bigint,
  spatialFilter?: SpatialFilter
): boolean | Set<bigint> {
  const tilePolygon = quadbinCellToBoundary(parent);

  if (!spatialFilter || booleanWithin(tilePolygon, spatialFilter)) {
    return true;
  }

  const clippedSpatialFilter = intersect(
    featureCollection([feature(tilePolygon), feature(spatialFilter)])
  );

  if (!clippedSpatialFilter) {
    return false;
  }

  const cells = quadbinGeometryToCells(
    clippedSpatialFilter.geometry,
    cellResolution
  );

  return new Set(cells);
}

///////////////////////////////////////////////////////////////////////////////
// H3

const BBOX_WEST: BBox = [-180, -90, 0, 90];
const BBOX_EAST: BBox = [0, -90, 180, 90];

/** @internal */
export function intersectTileH3(
  cellResolution: number,
  spatialFilter?: SpatialFilter
): true | Set<string> {
  if (!spatialFilter) {
    return true;
  }

  // Unlike quadbin and raster tiles, H3 children do not align to the parent's
  // boundaries. Per-tile coverage with `h3PolygonToCells` would return only
  // cells with _centers_ inside the clipped polygon — fewer cells. So for H3
  // we compute the coverage set for the entire spatial filter (more expensive).
  // In the future this could be replaced with `polygonToCellsExperimental`,
  // which can compute child cells in different modes.

  const spatialFilterFeature = feature(spatialFilter);

  // The current H3 polyfill algorithm can't deal with polygon segments of greater than 180 degrees longitude
  // so we clip the geometry to be sure that none of them is greater than 180 degrees
  // https://github.com/uber/h3-js/issues/24#issuecomment-431893796

  const cellsWest = h3PolygonToCells(
    bboxClip(spatialFilterFeature, BBOX_WEST).geometry.coordinates as
      | number[][]
      | number[][][],
    cellResolution,
    true
  );

  const cellsEast = h3PolygonToCells(
    bboxClip(spatialFilterFeature, BBOX_EAST).geometry.coordinates as
      | number[][]
      | number[][][],
    cellResolution,
    true
  );

  return new Set(cellsWest.concat(cellsEast));
}
