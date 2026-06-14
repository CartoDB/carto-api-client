// Client-side tiler for the small-source fast path (server: maps-api sc-556576).
//
// When a source is small enough, maps-api ships the WHOLE dataset as one
// full-resolution z0 tile (tilejson `maxzoom: 0`, tile URL carries `full=true`)
// instead of a pyramid. The client fetches that single tile once (CDN-shared,
// then zero warehouse work on every pan/zoom) and answers deck.gl's per-tile
// requests locally by slicing the cached features to each tile's bbox and
// re-applying the SAME per-zoom reduction the server tiler would have applied —
// otherwise deck.gl's native overzoom draws every feature at every zoom and
// low-zoom density blows up.
//
// The reduction formulas are ported verbatim from the maps-api dynamic tiler
// (getToleranceForSimplify / getPointsAggregationLevel / getMaxFeaturesByResolution)
// so a sliced tile matches what a per-tile request would have returned.

import type {Feature, Position} from 'geojson';
import type {TileResolution, TilejsonResult} from './types.js';

export type SliceableGeomType = 'points' | 'lines' | 'polygons';

const EARTH_RADIUS_METERS = 6378137;
const EARTH_CIRCUMFERENCE_METERS = 2 * Math.PI * EARTH_RADIUS_METERS; // 40075016.6856
// These three mirror maps-api *settings*, not constants: MAPS_API_V3_DYNAMIC_TILES_
// POINTS_AGGREGATION_LEVEL, _MAX_POLYGON_FEATURES, _MAX_LINES_FEATURES. The values
// below are the server defaults. If a deployment overrides those env vars the
// server tiler and this client slicer drift apart (locally-sliced tiles stop
// matching per-tile requests); keep them in sync if the server defaults change.
const DYNAMIC_TILES_POINTS_AGGREGATION_LEVEL = 8;
const DYNAMIC_TILES_MAX_POLYGON_FEATURES = 5000;
const DYNAMIC_TILES_MAX_LINES_FEATURES = 10000;
const POINT_DENSITY_FIELD = '_carto_point_density';

// Per-tileResolution corrections, identical to the server tiler.
const AGG_LEVEL_CORRECTION: Record<TileResolution, number> = {
  0.25: -1,
  0.5: 0,
  1: 1,
  2: 2,
  4: 3,
};
const MAX_FEATURES_MULTIPLIER: Record<TileResolution, number> = {
  0.25: 0.5,
  0.5: 1,
  1: 2,
  2: 3,
  4: 3,
};

/** Web-Mercator tile bbox in degrees: [west, south, east, north]. */
export function tileToBBox(
  z: number,
  x: number,
  y: number
): [number, number, number, number] {
  const n = 2 ** z;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const tileLat = (yy: number) => {
    const rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * yy) / n)));
    return (rad * 180) / Math.PI;
  };
  return [west, tileLat(y + 1), east, tileLat(y)];
}

/** Simplification tolerance for a zoom (server parity). Meters by default. */
export function getToleranceForSimplify(
  tileResolution: TileResolution,
  zoomLevel: number,
  // Default mirrors the maps-api twin ('meters'); callers slicing lon/lat
  // geojson pass 'degrees' explicitly.
  units: 'meters' | 'degrees' = 'meters'
): number {
  const circumference = units === 'meters' ? EARTH_CIRCUMFERENCE_METERS : 360;
  const tileWidth = circumference / 2 ** zoomLevel;
  const unitsPerPixel = tileWidth / (1024 * tileResolution);
  return unitsPerPixel / 2;
}

/** Points aggregation grid level for a zoom (server parity). */
export function getPointsAggregationLevel(
  tileResolution: TileResolution,
  zoomLevel: number
): number {
  return (
    zoomLevel +
    DYNAMIC_TILES_POINTS_AGGREGATION_LEVEL +
    AGG_LEVEL_CORRECTION[tileResolution]
  );
}

/** Per-tile feature cap for a geometry type + resolution (server parity). */
export function getMaxFeaturesByResolution(
  geomType: SliceableGeomType,
  tileResolution: TileResolution
): number {
  const base =
    geomType === 'lines'
      ? DYNAMIC_TILES_MAX_LINES_FEATURES
      : DYNAMIC_TILES_MAX_POLYGON_FEATURES;
  return base * MAX_FEATURES_MULTIPLIER[tileResolution];
}

/**
 * A full source is one the server collapsed to a single z0 tile: `maxzoom: 0`
 * and a tile URL template carrying `full=true`. (The client only sees this when
 * it opted in via `fullTiles` on the source.)
 */
export function isFullSourceTilejson(tilejson: TilejsonResult): boolean {
  return (
    tilejson.maxzoom === 0 &&
    Boolean(tilejson.tiles?.[0]?.includes('full=true'))
  );
}

interface IndexedFeature {
  feature: Feature;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** lon/lat of a representative point (centroid of the bbox). */
  cx: number;
  cy: number;
  /** ordering metric: bbox area for polygons, bbox diagonal for lines, 0 for points. */
  size: number;
}

export interface FullTileIndex {
  features: IndexedFeature[];
}

function eachPosition(coords: unknown, fn: (p: Position) => void): void {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number') {
    fn(coords as Position);
    return;
  }
  for (const c of coords) eachPosition(c, fn);
}

/**
 * Index the full source's features once (per loaded z0 tile). O(n) over
 * coordinates; the result is reused for every subsequent local tile slice.
 */
export function buildFullTileIndex(features: Feature[]): FullTileIndex {
  const indexed: IndexedFeature[] = [];
  for (const feature of features) {
    if (!feature.geometry || feature.geometry.type === 'GeometryCollection') {
      continue;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    eachPosition(
      (feature.geometry as {coordinates: unknown}).coordinates,
      ([lng, lat]) => {
        if (lng < minX) minX = lng;
        if (lat < minY) minY = lat;
        if (lng > maxX) maxX = lng;
        if (lat > maxY) maxY = lat;
      }
    );
    if (!Number.isFinite(minX)) continue;
    const isPolygon = feature.geometry.type.includes('Polygon');
    const w = maxX - minX;
    const h = maxY - minY;
    const size = isPolygon ? w * h : Math.sqrt(w * w + h * h);
    indexed.push({
      feature,
      minX,
      minY,
      maxX,
      maxY,
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      size,
    });
  }
  return {features: indexed};
}

export interface SliceOptions {
  geomType: SliceableGeomType;
  tileResolution?: TileResolution;
}

/**
 * Produce the features for tile z/x/y from the cached full-source index,
 * applying the same per-zoom reduction the server tiler would: bbox cull,
 * sub-pixel cull + biggest-first cap for lines/polygons, or a Web-Mercator grid
 * aggregation for points (with the `_carto_point_density` count the tilers emit).
 */
export function sliceFullTile(
  index: FullTileIndex,
  tile: {z: number; x: number; y: number},
  {geomType, tileResolution = 0.5}: SliceOptions
): Feature[] {
  const [west, south, east, north] = tileToBBox(tile.z, tile.x, tile.y);
  // bbox cull — only features intersecting this tile.
  const inTile = index.features.filter(
    (f) =>
      f.maxX >= west && f.minX <= east && f.maxY >= south && f.minY <= north
  );

  if (geomType === 'points') {
    return aggregatePoints(inTile, tileResolution, tile.z);
  }

  // lines / polygons: drop sub-pixel features, then biggest-first cap.
  const pixel = getToleranceForSimplify(tileResolution, tile.z, 'degrees') * 2; // ~1 px in degrees
  const minSize = geomType === 'lines' ? pixel : pixel * pixel;
  const survivors = inTile.filter((f) => f.size >= minSize || f.size === 0);
  survivors.sort((a, b) => b.size - a.size);
  const cap = getMaxFeaturesByResolution(geomType, tileResolution);
  return survivors.slice(0, cap).map((f) => f.feature);
}

function aggregatePoints(
  inTile: IndexedFeature[],
  tileResolution: TileResolution,
  zoomLevel: number
): Feature[] {
  const aggLevel = getPointsAggregationLevel(tileResolution, zoomLevel);
  const cells = 2 ** aggLevel;
  const cellOf = (lng: number, lat: number): string => {
    // Web-Mercator pixel cell, identical math to the server points tiler.
    const qx = Math.floor(
      cells *
        (Math.round(lng * 111319.49079327357) / EARTH_CIRCUMFERENCE_METERS +
          0.5)
    );
    const qy = Math.floor(
      cells *
        (-Math.round(
          Math.log(Math.tan(0.7853981633974483 + lat * 0.008726646259971648)) *
            EARTH_RADIUS_METERS
        ) /
          EARTH_CIRCUMFERENCE_METERS +
          0.5)
    );
    return `${qx}:${qy}`;
  };

  const byCell = new Map<string, {rep: Feature; count: number}>();
  for (const f of inTile) {
    const key = cellOf(f.cx, f.cy);
    const existing = byCell.get(key);
    if (existing) {
      existing.count++;
    } else {
      byCell.set(key, {rep: f.feature, count: 1});
    }
  }

  const out: Feature[] = [];
  for (const {rep, count} of byCell.values()) {
    out.push({
      ...rep,
      properties: {...(rep.properties ?? {}), [POINT_DENSITY_FIELD]: count},
    });
  }
  return out;
}
