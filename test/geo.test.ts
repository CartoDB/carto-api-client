import {describe, expect, test} from 'vitest';
import {
  createViewportSpatialFilter,
  createPolygonSpatialFilter,
} from '@carto/api-client';
import bboxPolygon from '@turf/bbox-polygon';
import {polygon, multiPolygon} from '@turf/helpers';

describe('createViewportSpatialFilter', () => {
  test('polygon', () => {
    expect(createViewportSpatialFilter([-10, -10, 10, 10])).toStrictEqual(
      bboxPolygon([-10, -10, 10, 10]).geometry
    );

    expect(
      createViewportSpatialFilter([-344.26, -75.051, 230.265, 75.051])
    ).toStrictEqual({
      type: 'Polygon',
      coordinates: [
        [
          [-180, -75.051],
          [180, -75.051],
          [180, 75.051],
          [-180, 75.051],
          [-180, -75.051],
        ],
      ],
    });
  });

  test('multipolygon', () => {
    expect(
      createViewportSpatialFilter([-125.26, -85.051, 230.265, 85.051])
    ).toStrictEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [-180, -85.051],
            [-129.735, -85.051],
            [-129.735, 85.051],
            [-180, 85.051],
            [-180, -85.051],
          ],
        ],
        [
          [
            [-125.26, -85.051],
            [180, -85.051],
            [180, 85.051],
            [-125.26, 85.051],
            [-125.26, -85.051],
          ],
        ],
      ],
    });
  });

  test('global', () => {
    expect(
      createViewportSpatialFilter([-344.259, -85.051, 230.264, 85.051])
    ).toBeUndefined();
  });
});

describe('createPolygonSpatialFilter', () => {
  test('undefined', () => {
    expect(createPolygonSpatialFilter(null)).toBeUndefined();
  });

  test('readonly', () => {
    let input = bboxPolygon([-10, -10, 10, 10]).geometry;

    expect(createPolygonSpatialFilter(input)).toStrictEqual(input);

    input = polygon([
      [
        [-90, 0],
        [0, -45],
        [90, 0],
        [0, 45],
        [-90, 0],
      ],
    ]).geometry;

    expect(createPolygonSpatialFilter(input)).toStrictEqual(input);
  });

  test('multipolygons-wrapping-from-west', () => {
    const input = multiPolygon([
      [
        [
          [-90, 0],
          [0, -45],
          [90, 0],
          [0, 45],
          [-90, 0],
        ],
      ],
      [
        [
          [-190, -50],
          [-170, -70],
          [-170, 70],
          [-190, 50],
          [-190, -50],
        ],
      ],
    ]).geometry;

    const expected = multiPolygon([
      [
        [
          [-180, -60],
          [-170, -70],
          [-170, 70],
          [-180, 60],
          [-180, -60],
        ],
      ],
      [
        [
          [-90, 0],
          [0, -45],
          [90, 0],
          [0, 45],
          [-90, 0],
        ],
      ],
      [
        [
          [170, -50],
          [180, -60],
          [180, 60],
          [170, 50],
          [170, -50],
        ],
      ],
    ]).geometry;

    expect(createPolygonSpatialFilter(input)).toStrictEqual(expected);
  });

  test('multipolygons-wrapping-from-east', () => {
    const input = multiPolygon([
      [
        [
          [-90, 0],
          [0, -45],
          [90, 0],
          [0, 45],
          [-90, 0],
        ],
      ],
      [
        [
          [170, -50],
          [190, -70],
          [190, 70],
          [170, 50],
          [170, -50],
        ],
      ],
    ]).geometry;

    const expected = multiPolygon([
      [
        [
          [-180, -60],
          [-170, -70],
          [-170, 70],
          [-180, 60],
          [-180, -60],
        ],
      ],
      [
        [
          [-90, 0],
          [0, -45],
          [90, 0],
          [0, 45],
          [-90, 0],
        ],
      ],
      [
        [
          [170, -50],
          [180, -60],
          [180, 60],
          [170, 50],
          [170, -50],
        ],
      ],
    ]).geometry;

    expect(createPolygonSpatialFilter(input)).toStrictEqual(expected);
  });

  test('unwrap-large-viewport', () => {
    const input = polygon([
      [
        [-200, -80],
        [210, -80],
        [210, 75],
        [-200, 75],
        [-200, -80],
      ],
    ]).geometry;
    const expected = polygon([
      [
        [-180, -80],
        [180, -80],
        [180, 75],
        [-180, 75],
        [-180, -80],
      ],
    ]).geometry;
    expect(createPolygonSpatialFilter(input)).toStrictEqual(expected);
  });

  test('remove-degenerate-polygons', () => {
    const input = multiPolygon([
      [
        [
          [-200, -80],
          [210, -80],
          [210, 75],
          [-200, 75],
          [-200, -80],
        ],
      ],
      [
        [
          [-90, 0],
          [0, -45],
          [90, 0],
          [0, 45],
          [-90, 0],
        ],
      ],
    ]).geometry;

    const expected = polygon([
      [
        [-180, -80],
        [180, -80],
        [180, 75],
        [-180, 75],
        [-180, -80],
      ],
    ]).geometry;

    expect(createPolygonSpatialFilter(input)).toStrictEqual(expected);
  });
});
