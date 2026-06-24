import {describe, expect, test} from 'vitest';
import {
  _getHexagonResolution,
  _getPointsAggregationLevel,
} from '@carto/api-client';

describe('_getHexagonResolution', () => {
  test.each([
    // latitude
    [{zoom: 10, latitude: 89, tileSize: 512}, 8],
    [{zoom: 10, latitude: 45, tileSize: 512}, 5],
    [{zoom: 10, latitude: 0, tileSize: 512}, 4],
    // zoom
    [{zoom: 4, latitude: 0, tileSize: 512}, 0],
    [{zoom: 8, latitude: 0, tileSize: 512}, 3],
    [{zoom: 12, latitude: 0, tileSize: 512}, 6],
    // tileSize
    [{zoom: 8, latitude: 0, tileSize: 256}, 4],
    [{zoom: 8, latitude: 0, tileSize: 512}, 3],
    [{zoom: 8, latitude: 0, tileSize: 1024}, 2],
  ])('%s -> %i', ({zoom, latitude, tileSize}, expected) => {
    expect(_getHexagonResolution({zoom, latitude}, tileSize)).toBe(expected);
  });
});

describe('getPointsAggregationLevel', () => {
  test.each([
    // tileResolution correction at a fixed zoom (default offset 8)
    [{tileResolution: 0.25, zoomLevel: 5}, 12],
    [{tileResolution: 0.5, zoomLevel: 5}, 13],
    [{tileResolution: 1, zoomLevel: 5}, 14],
    [{tileResolution: 2, zoomLevel: 5}, 15],
    [{tileResolution: 4, zoomLevel: 5}, 16],
    // zoom scales the level 1:1
    [{tileResolution: 0.5, zoomLevel: 0}, 8],
    [{tileResolution: 0.5, zoomLevel: 12}, 20],
  ] as const)('%o -> %i', ({tileResolution, zoomLevel}, expected) => {
    expect(_getPointsAggregationLevel({tileResolution, zoomLevel})).toBe(
      expected
    );
  });
});
