import {describe, expect, test} from 'vitest';
import {_getHexagonResolution} from '@carto/api-client';

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
