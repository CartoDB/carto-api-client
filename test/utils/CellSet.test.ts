import {describe, test, expect} from 'vitest';
import {CellSet} from '@carto/api-client';
import {geometryToCells} from 'quadbin';
import {Feature, Polygon} from 'geojson';

const FEATURE_A: Feature<Polygon> = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [
      [
        [-40.13189, 45.6739],
        [-42.10079, 43.01305],
        [-37.36239, 41.92935],
        [-35.40455, 44.82921],
        [-40.13189, 45.6739],
      ],
    ],
    type: 'Polygon',
  },
};

const FEATURE_B: Feature<Polygon> = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [
      [
        [-35.96365, 46.0724],
        [-37.42281, 45.45737],
        [-37.97751, 44.22816],
        [-36.42785, 42.89107],
        [-33.67079, 42.76472],
        [-32.42917, 44.74733],
        [-34.0996, 46.20022],
        [-35.96365, 46.0724],
      ],
    ],
    type: 'Polygon',
  },
};

describe('CellSet', () => {
  test('has', () => {
    const cells = new CellSet([0n, 1n, 3n, 4n]);

    for (const cell of [0n, 1n, 3n, 4n]) {
      expect(cells.has(cell), cell.toString()).toBe(true);
    }

    for (const cell of [2n, 5n, -1n, 12793n]) {
      expect(cells.has(cell), cell.toString()).toBe(false);
    }
  });

  test('matches native Set', () => {
    // compute quadbin coverage at res=12, aiming for ~2500 cells.
    const cellsA = geometryToCells(FEATURE_A.geometry, 12n);
    const cellsB = geometryToCells(FEATURE_B.geometry, 12n);

    const nativeSet = new Set(cellsA);
    const cellSet = new CellSet(cellsA);

    const expectedIntersection = cellsB.filter((cell) => nativeSet.has(cell));
    const actualIntersection = cellsB.filter((cell) => cellSet.has(cell));

    expect(actualIntersection.length).toBeGreaterThan(500);
    expect(actualIntersection).toEqual(expectedIntersection);
  });
});
