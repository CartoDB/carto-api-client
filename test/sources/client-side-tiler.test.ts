import {describe, test, expect} from 'vitest';
// Public slicer API is consumed from the package entry (the build); the internal
// reduction helpers aren't exported, so the unit tests import them from the
// module directly.
import {
  isFullSourceTilejson,
  buildFullTileIndex,
  sliceFullTile,
} from '@carto/api-client';
import {
  tileToBBox,
  getPointsAggregationLevel,
  getMaxFeaturesByResolution,
} from '../../src/sources/client-side-tiler.js';
import type {Feature, Point, Polygon, LineString} from 'geojson';
import type {TilejsonResult} from '@carto/api-client';

// lng/lat -> tile x/y at zoom z (Web Mercator), for picking a covering tile.
function lngLatToTile(
  lng: number,
  lat: number,
  z: number
): {z: number; x: number; y: number} {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const rad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  );
  return {z, x, y};
}

const pt = (
  lng: number,
  lat: number,
  props: Record<string, unknown> = {}
): Feature<Point> => ({
  type: 'Feature',
  properties: props,
  geometry: {type: 'Point', coordinates: [lng, lat]},
});

const square = (
  west: number,
  south: number,
  size: number,
  props: Record<string, unknown> = {}
): Feature<Polygon> => ({
  type: 'Feature',
  properties: props,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [west + size, south],
        [west + size, south + size],
        [west, south + size],
        [west, south],
      ],
    ],
  },
});

const line = (
  coords: [number, number][],
  props: Record<string, unknown> = {}
): Feature<LineString> => ({
  type: 'Feature',
  properties: props,
  geometry: {type: 'LineString', coordinates: coords},
});

describe('client-side-tiler', () => {
  describe('isFullSourceTilejson', () => {
    const base = {
      maxzoom: 0,
      tiles: ['https://x/{z}/{x}/{y}?full=true&formatTiles=binary'],
    };
    test('true for maxzoom 0 + full=true tile URL', () => {
      expect(isFullSourceTilejson(base as unknown as TilejsonResult)).toBe(
        true
      );
    });
    test('false when not a full source', () => {
      expect(
        isFullSourceTilejson({
          maxzoom: 20,
          tiles: ['https://x/{z}/{x}/{y}'],
        } as unknown as TilejsonResult)
      ).toBe(false);
      expect(
        isFullSourceTilejson({
          maxzoom: 0,
          tiles: ['https://x/{z}/{x}/{y}'],
        } as unknown as TilejsonResult)
      ).toBe(false);
    });
  });

  describe('tileToBBox', () => {
    test('z0/0/0 is the whole world', () => {
      const [w, s, e, n] = tileToBBox(0, 0, 0);
      expect(w).toBeCloseTo(-180);
      expect(e).toBeCloseTo(180);
      expect(s).toBeCloseTo(-85.051, 2);
      expect(n).toBeCloseTo(85.051, 2);
    });
  });

  describe('points aggregation (server-parity grid)', () => {
    // three points within ~200m of each other near Luxembourg
    const cluster = [
      pt(6.13, 49.61, {id: 1}),
      pt(6.1312, 49.6111, {id: 2}),
      pt(6.1324, 49.6122, {id: 3}),
    ];
    const index = buildFullTileIndex(cluster);

    test('low zoom (z0) collapses the cluster to one feature with a density count', () => {
      const out = sliceFullTile(
        index,
        {z: 0, x: 0, y: 0},
        {geomType: 'points'}
      );
      expect(out).toHaveLength(1);
      expect(out[0].properties?._carto_point_density).toEqual(3);
    });

    test('deep zoom keeps every point separate (grid finer than the spacing)', () => {
      // Place 3 points near the centre of a known z14 tile, spaced ~1/8 tile
      // (~200m) apart — well inside the tile (no boundary straddle) and far
      // larger than the ~6m aggregation cell at z14, so none merge.
      const z = 14;
      const tile = lngLatToTile(6.13, 49.61, z);
      const [w, s, e, n] = tileToBBox(z, tile.x, tile.y);
      const cx = (w + e) / 2;
      const cy = (s + n) / 2;
      const spread = (e - w) / 8;
      const spreadIndex = buildFullTileIndex([
        pt(cx - spread, cy, {id: 1}),
        pt(cx, cy, {id: 2}),
        pt(cx + spread, cy, {id: 3}),
      ]);
      const out = sliceFullTile(spreadIndex, tile, {geomType: 'points'});
      expect(out).toHaveLength(3);
      expect(out.every((f) => f.properties?._carto_point_density === 1)).toBe(
        true
      );
    });

    test('grid level matches the server formula', () => {
      // default tileResolution 0.5 -> correction 0
      expect(getPointsAggregationLevel(0.5, 0)).toEqual(8);
      expect(getPointsAggregationLevel(0.5, 20)).toEqual(28);
    });
  });

  describe('polygons slicing', () => {
    test('bbox-culls features outside the tile', () => {
      const tile = lngLatToTile(6.1, 49.6, 10);
      const [west, south] = tileToBBox(tile.z, tile.x, tile.y);
      const index = buildFullTileIndex([
        square(west + 0.001, south + 0.001, 0.005, {id: 'inside'}),
        square(-120, 30, 0.005, {id: 'far-away'}),
      ]);
      const out = sliceFullTile(index, tile, {geomType: 'polygons'});
      expect(out).toHaveLength(1);
      expect(out[0].properties?.id).toEqual('inside');
    });

    test('drops sub-pixel polygons, keeps ones bigger than ~1px', () => {
      // at z0 ~1px ≈ 0.70deg, so the cull threshold is ~0.49 deg² of bbox area.
      const index = buildFullTileIndex([
        square(0, 0, 1, {id: 'big'}), // 1 deg² ≥ threshold
        square(20, 20, 0.01, {id: 'tiny'}), // 1e-4 deg² ≪ threshold
      ]);
      const out = sliceFullTile(
        index,
        {z: 0, x: 0, y: 0},
        {geomType: 'polygons'}
      );
      expect(out.map((f) => f.properties?.id)).toEqual(['big']);
    });

    test('caps at the per-resolution max, biggest-first', () => {
      const cap = getMaxFeaturesByResolution('polygons', 0.5); // 5000
      const features: Feature[] = [];
      // many squares across the world, each large enough to survive the z0
      // sub-pixel cull (~0.7deg side), so the slice is bounded only by the cap.
      for (let i = 0; i < cap + 50; i++) {
        const west = -170 + (i % 160) * 2;
        const south = -40 + ((i * 7) % 70);
        features.push(square(west, south, 1 + (i % 5) * 0.5, {id: i}));
      }
      const out = sliceFullTile(
        buildFullTileIndex(features),
        {z: 0, x: 0, y: 0},
        {geomType: 'polygons'}
      );
      expect(out.length).toEqual(cap);
    });
  });

  describe('lines slicing', () => {
    test('drops sub-pixel lines, keeps long ones', () => {
      // at z0 ~1px ≈ 0.70deg (bbox diagonal threshold for lines).
      const index = buildFullTileIndex([
        line(
          [
            [0, 0],
            [10, 10],
          ],
          {id: 'long'}
        ), // diagonal ~14deg
        line(
          [
            [0, 0],
            [0.0005, 0.0005],
          ],
          {id: 'tiny'}
        ), // diagonal ~7e-4deg
      ]);
      const out = sliceFullTile(index, {z: 0, x: 0, y: 0}, {geomType: 'lines'});
      expect(out.map((f) => f.properties?.id)).toEqual(['long']);
    });
  });

  describe('buildFullTileIndex', () => {
    test('skips null/collection geometry and spans all Multi* coordinates', () => {
      const index = buildFullTileIndex([
        {type: 'Feature', properties: {}, geometry: null} as unknown as Feature,
        {
          type: 'Feature',
          properties: {},
          geometry: {type: 'GeometryCollection', geometries: []},
        } as unknown as Feature,
        {
          type: 'Feature',
          properties: {id: 'multi'},
          geometry: {
            type: 'MultiPoint',
            coordinates: [
              [0, 0],
              [10, 8],
            ],
          },
        } as Feature,
      ]);
      // null + GeometryCollection are skipped; only the MultiPoint is indexed.
      expect(index.features).toHaveLength(1);
      const m = index.features[0];
      expect([m.minX, m.minY, m.maxX, m.maxY]).toEqual([0, 0, 10, 8]);
    });
  });
});
