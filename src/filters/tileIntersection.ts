import type {BBox, Polygon} from 'geojson';
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
import {
  cellToBoundary as h3CellToBoundary,
  polygonToCells as h3PolygonToCells,
} from 'h3-js';
import bboxClip from '@turf/bbox-clip';

// Computes intersections between spatial filters and tiles in various formats.
// Used to pre-filter tile features before processing for widget calculations.
//
// - FILTER INTERSECTS TILE: Requires a more detailed per-feature check for each
//    feature in the tile. Compute a clipped spatial filter local to the tile or,
//    for spatial indexes, a covering set.
// - FILTER FULLY CONTAINS TILE: Process all features in tile, no more checks.
// - NO FILTER: Process all features in tile, no more checks.
// - NO OVERLAP: If tile and spatial filter do not overlap, exclude all features.
//
// Computing a covering set for spatial indexes may be very expensive for large
// spatial filters and small cell resolutions. For example, a viewport at z=3
// would contain ~18,000,000 raster cells at resolution=14. To avoid ever
// creating a covering set of this size, do filtering per-tile, not globally.

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
  parent: string,
  cellResolution: number,
  spatialFilter?: SpatialFilter
): boolean | Set<string> {
  const tilePolygon: Polygon = {
    type: 'Polygon',
    coordinates: [h3CellToBoundary(parent, true)],
  };

  if (!spatialFilter || booleanWithin(tilePolygon, spatialFilter)) {
    return true;
  }

  const clippedSpatialFilter = intersect(
    featureCollection([feature(tilePolygon), feature(spatialFilter)])
  );

  if (!clippedSpatialFilter) {
    return false;
  }

  // The current H3 polyfill algorithm can't deal with polygon segments of greater than 180 degrees longitude
  // so we clip the geometry to be sure that none of them is greater than 180 degrees
  // https://github.com/uber/h3-js/issues/24#issuecomment-431893796

  const cellsWest = h3PolygonToCells(
    bboxClip(clippedSpatialFilter, BBOX_WEST).geometry.coordinates as
      | number[][]
      | number[][][],
    cellResolution,
    true
  );

  const cellsEast = h3PolygonToCells(
    bboxClip(clippedSpatialFilter, BBOX_EAST).geometry.coordinates as
      | number[][]
      | number[][][],
    cellResolution,
    true
  );

  return new Set(cellsWest.concat(cellsEast));
}
