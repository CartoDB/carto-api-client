import {describe, expect, test, vi} from 'vitest';
import {geojsonToBinary} from '@loaders.gl/gis';
import {
  tileFeatures,
  createViewportSpatialFilter,
  Viewport,
  Tile,
  TileFormat,
  FEATURE_GEOM_PROPERTY,
} from '@carto/api-client';
import {
  Feature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson';

describe('viewport features with binary mode', () => {
  const viewport: Viewport = [-10, -10, 10, 10]; // west - south - east - north
  const spatialFilter = createViewportSpatialFilter(viewport);
  const [west, south, east, north] = viewport;

  describe('return no data', () => {
    test('tiles are not visible', () => {
      const mockedTiles = [...Array(10)].map(() => ({
        isVisible: false,
      }));

      const properties = tileFeatures({
        tiles: mockedTiles as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(properties).toEqual([]);
    });

    test('tiles have no data', () => {
      const mockedTiles = [{data: null}, {data: undefined}];

      const properties = tileFeatures({
        tiles: mockedTiles as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(properties).toEqual([]);
    });

    test('a tile is visible but it has no data', () => {
      const mockedTiles = [{isVisible: true, data: null}];

      const properties = tileFeatures({
        tiles: mockedTiles as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(properties).toEqual([]);
    });

    test('a tile has data but is not visibile', () => {
      const mockedTiles = [{isVisible: false, data: [{}]}];

      const properties = tileFeatures({
        tiles: mockedTiles as unknown as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(properties).toEqual([]);
    });
  });

  describe('correctly returns data', () => {
    test('should handle linestrings correctly', () => {
      const linestrings: Feature<LineString>[] = [...Array(3)].map((_, i) => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          // prettier-ignore
          coordinates: [[i, i], [i, i + 1], [i, i + 2]],
        },
        properties: {
          cartodb_id: i + 1,
          other_prop: i,
        },
      }));

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(linestrings),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });

      const expectedProperties = [
        {cartodb_id: 1, other_prop: 0},
        {cartodb_id: 2, other_prop: 1},
        {cartodb_id: 3, other_prop: 2},
      ];

      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });

      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: linestrings[i].geometry,
        }))
      );
    });

    test('should handle multilinestrings correctly', () => {
      const multilinestrings: Feature<MultiLineString>[] = [...Array(3)].map(
        (_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'MultiLineString',
            // prettier-ignore
            coordinates: [[[i, i], [i + 1, i + 1]], [[i + 2, i + 2], [i + 3, i + 3]]],
          },
          properties: {
            cartodb_id: i + 1,
            other_prop: i,
          },
        })
      );

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(multilinestrings),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });

      const expectedProperties = [
        {cartodb_id: 1, other_prop: 0},
        {cartodb_id: 2, other_prop: 1},
        {cartodb_id: 3, other_prop: 2},
      ];

      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });

      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: {
            coordinates: multilinestrings[i].geometry.coordinates[0],
            type: 'LineString',
          },
        }))
      );
    });

    test('should handle polygons correctly', () => {
      const polygons: Feature<Polygon>[] = [...Array(3)].map((_, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          // prettier-ignore
          coordinates: [[[i, i], [i + 1, i], [i + 1, i + 1], [i, i + 1], [i, i]]],
        },
        properties: {
          cartodb_id: i + 1,
          other_prop: i,
        },
      }));

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(polygons),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });
      const expectedProperties = [
        {cartodb_id: 1, other_prop: 0},
        {cartodb_id: 2, other_prop: 1},
        {cartodb_id: 3, other_prop: 2},
      ];

      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });
      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: polygons[i].geometry,
        }))
      );
    });

    test('should handle multilipolygons correctly', () => {
      const multipolygons: Feature<MultiPolygon>[] = [...Array(3)].map(
        (_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            // prettier-ignore
            coordinates: [
            [[[i, i], [i + 1, i], [i + 1, i + 1], [i, i + 1], [i, i]]],
            [[[i + 1, i + 1], [i + 2, i + 1], [i + 2, i + 2], [i + 1, i + 2], [i + 1, i + 1]]]
          ],
          },
          properties: {
            cartodb_id: i + 1,
            other_prop: i,
          },
        })
      );

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(multipolygons),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });
      const expectedProperties = [
        {cartodb_id: 1, other_prop: 0},
        {cartodb_id: 2, other_prop: 1},
        {cartodb_id: 3, other_prop: 2},
      ];

      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });
      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: {
            coordinates: multipolygons[i].geometry.coordinates[0],
            type: 'Polygon',
          },
        }))
      );
    });
  });

  describe('with repeated features', () => {
    test('points', () => {
      const points: Feature<Point>[] = [...Array(4)].map(() => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          cartodb_id: 1,
          other_prop: 1,
        },
      }));

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(points),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });
      const expectedProperties = [{cartodb_id: 1, other_prop: 1}];
      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });
      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: points[i].geometry,
        }))
      );
    });

    test('linestrings', () => {
      const linestrings: Feature<LineString>[] = [...Array(4)].map(() => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          // prettier-ignore
          coordinates: [[0, 0], [0, 1], [1, 2]],
        },
        properties: {
          cartodb_id: 1,
          other_prop: 1,
        },
      }));

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(linestrings),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });
      const expectedProperties = [{cartodb_id: 1, other_prop: 1}];
      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });
      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: linestrings[i].geometry,
        }))
      );
    });

    test('multilinestrings', () => {
      const multilinestrings: Feature<MultiLineString>[] = [...Array(4)].map(
        () => ({
          type: 'Feature',
          geometry: {
            type: 'MultiLineString',
            // prettier-ignore
            coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]],
          },
          properties: {
            cartodb_id: 1,
            other_prop: 1,
          },
        })
      );

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(multilinestrings),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });
      const expectedProperties = [{cartodb_id: 1, other_prop: 1}];
      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });
      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: {
            coordinates: multilinestrings[i].geometry.coordinates[0],
            type: 'LineString',
          },
        }))
      );
    });

    test('polygons', () => {
      const polygons: Feature<Polygon>[] = [...Array(4)].map(() => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          // prettier-ignore
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 2], [0, 0]]],
        },
        properties: {
          cartodb_id: 1,
          other_prop: 1,
        },
      }));

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(polygons),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });
      const expectedProperties = [{cartodb_id: 1, other_prop: 1}];
      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });
      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: polygons[i].geometry,
        }))
      );
    });

    test('multipolygons', () => {
      const multipolygons: Feature<MultiPolygon>[] = [...Array(4)].map(() => ({
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          // prettier-ignore
          coordinates: [
            [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            [[[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]]
          ],
        },
        properties: {
          cartodb_id: 1,
          other_prop: 1,
        },
      }));

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(multipolygons),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
      });
      const expectedProperties = [{cartodb_id: 1, other_prop: 1}];
      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'cartodb_id',
        storeGeometry: true,
      });
      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: {
            coordinates: multipolygons[i].geometry.coordinates[0],
            type: 'Polygon',
          },
        }))
      );
    });
  });

  describe('uniqueIdProperty is undefined', () => {
    describe('tiles provide unique id field', () => {
      test('linestrings', () => {
        const linestrings: Feature<LineString>[] = [...Array(3)].map(
          (_, i) => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              // prettier-ignore
              coordinates: [[0, 0], [0, 1], [1, 2]],
            },
            properties: {
              other_prop: i,
            },
          })
        );

        // Two tiles, linestrings[0] is present in both
        const binaryData1 = geojsonToBinary([linestrings[0], linestrings[1]]);
        // @ts-ignore
        binaryData1.lines.fields = [{id: 100}, {id: 101}];

        const binaryData2 = geojsonToBinary([linestrings[0], linestrings[2]]);
        // @ts-ignore
        binaryData2.lines.fields = [{id: 100}, {id: 102}];

        const mockedTiles = [
          {
            isVisible: true,
            data: binaryData1,
            bbox: {west, east, north, south},
          },
          {
            isVisible: true,
            data: binaryData2,
            bbox: {west, east, north, south},
          },
        ];

        let properties = tileFeatures({
          tiles: mockedTiles as Tile[],
          tileFormat: TileFormat.BINARY,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
        });

        const expectedProperties = [
          {other_prop: 0},
          {other_prop: 1},
          {other_prop: 2},
        ];
        expect(properties).toEqual(expectedProperties);

        properties = tileFeatures({
          tiles: mockedTiles as Tile[],
          tileFormat: TileFormat.BINARY,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
          storeGeometry: true,
        });
        expect(properties).toEqual(
          expectedProperties.map((expected, i) => ({
            ...expected,
            [FEATURE_GEOM_PROPERTY]: linestrings[i].geometry,
          }))
        );
      });
    });

    describe('features have cartodb_id field', () => {
      test('points', () => {
        const points: Feature<Point>[] = [...Array(3)].map((_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [i, i],
          },
          properties: {
            cartodb_id: i + 1,
            other_prop: i,
          },
        }));

        const mockedTile = [
          {
            isVisible: true,
            data: geojsonToBinary(points),
            bbox: {west, east, north, south},
          },
        ];

        let properties = tileFeatures({
          tiles: mockedTile as Tile[],
          tileFormat: TileFormat.BINARY,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
        });
        const expectedProperties = [
          {cartodb_id: 1, other_prop: 0},
          {cartodb_id: 2, other_prop: 1},
          {cartodb_id: 3, other_prop: 2},
        ];
        expect(properties).toEqual(expectedProperties);

        properties = tileFeatures({
          tiles: mockedTile as Tile[],
          tileFormat: TileFormat.BINARY,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
          storeGeometry: true,
        });
        expect(properties).toEqual(
          expectedProperties.map((expected, i) => ({
            ...expected,
            [FEATURE_GEOM_PROPERTY]: points[i].geometry,
          }))
        );
      });
    });

    describe('features have geoid field', () => {
      test('points', () => {
        const points: Feature<Point>[] = [...Array(3)].map((_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [i, i],
          },
          properties: {
            geoid: String(i + 1), // Because geoid from DO datasets is a string
            other_prop: i,
          },
        }));

        const mockedTile = [
          {
            isVisible: true,
            data: geojsonToBinary(points),
            bbox: {west, east, north, south},
          },
        ];

        let properties = tileFeatures({
          tiles: mockedTile as Tile[],
          tileFormat: TileFormat.BINARY,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
        });
        const expectedProperties = [
          {geoid: '1', other_prop: 0},
          {geoid: '2', other_prop: 1},
          {geoid: '3', other_prop: 2},
        ];
        expect(properties).toEqual(expectedProperties);

        properties = tileFeatures({
          tiles: mockedTile as Tile[],
          tileFormat: TileFormat.BINARY,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
          storeGeometry: true,
        });
        expect(properties).toEqual(
          expectedProperties.map((expected, i) => ({
            ...expected,
            [FEATURE_GEOM_PROPERTY]: points[i].geometry,
          }))
        );
      });
    });

    describe('no explicit id field', () => {
      test('points', () => {
        const points: Feature<Point>[] = [...Array(3)].map((_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [i, i],
          },
          properties: {
            other_prop: i,
          },
        }));

        const mockedTile = [
          {
            isVisible: true,
            data: geojsonToBinary(points),
            bbox: {west, east, north, south},
          },
        ];

        let properties = tileFeatures({
          tiles: mockedTile as Tile[],
          tileFormat: TileFormat.MVT,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
        });
        const expectedProperties = [
          {other_prop: 0},
          {other_prop: 1},
          {other_prop: 2},
        ];
        expect(properties).toEqual(expectedProperties);

        properties = tileFeatures({
          tiles: mockedTile as Tile[],
          tileFormat: TileFormat.BINARY,
          spatialDataType: 'geo',
          spatialFilter,
          uniqueIdProperty: undefined,
          storeGeometry: true,
        });
        expect(properties).toEqual(
          expectedProperties.map((expected, i) => ({
            ...expected,
            [FEATURE_GEOM_PROPERTY]: points[i].geometry,
          }))
        );
      });
    });
  });

  describe('uniqueIdProperty is defined', () => {
    test('points', () => {
      const points: Feature<Point>[] = [...Array(3)].map((_, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [i, i],
        },
        properties: {
          user_id: i + 1,
          other_prop: i,
        },
      }));

      const mockedTile = [
        {
          isVisible: true,
          data: geojsonToBinary(points),
          bbox: {west, east, north, south},
        },
      ];

      let properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'user_id',
      });
      const expectedProperties = [
        {user_id: 1, other_prop: 0},
        {user_id: 2, other_prop: 1},
        {user_id: 3, other_prop: 2},
      ];

      expect(properties).toEqual(expectedProperties);

      properties = tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        uniqueIdProperty: 'user_id',
        storeGeometry: true,
      });

      expect(properties).toEqual(
        expectedProperties.map((expected, i) => ({
          ...expected,
          [FEATURE_GEOM_PROPERTY]: points[i].geometry,
        }))
      );
    });
  });

  describe('Different tile formats', () => {
    const points: Feature<Point>[] = [...Array(3)].map((_, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [i, i],
      },
      properties: {},
    }));

    const mockedTile = [
      {
        isVisible: true,
        data: geojsonToBinary(points),
        bbox: {west, east, north, south},
      },
    ];

    test.skip('transformToTileCoords should only be called if format is mvt', () => {
      // TODO: Cannot spy on functions in bundled builds, need to refactor this test.
      const transformToTileCoordsSpy = vi.fn();

      tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.GEOJSON,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(transformToTileCoordsSpy).toHaveBeenCalledTimes(0);

      tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.GEOJSON,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(transformToTileCoordsSpy).toHaveBeenCalledTimes(0);

      tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.GEOJSON,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(transformToTileCoordsSpy).toHaveBeenCalledTimes(1);

      transformToTileCoordsSpy.mockRestore();
    });

    test.skip('transformTileCoordsToWGS84 should only be called if format is mvt and storeGeometry option is true', () => {
      // TODO: Cannot spy on functions in bundled builds, need to refactor this test.
      const transformTileCoordsToWGS84Spy = vi.fn();

      tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.GEOJSON,
        spatialDataType: 'geo',
        spatialFilter,
        storeGeometry: true,
      });
      expect(transformTileCoordsToWGS84Spy).toHaveBeenCalledTimes(0);

      tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.BINARY,
        spatialDataType: 'geo',
        spatialFilter,
        storeGeometry: true,
      });
      expect(transformTileCoordsToWGS84Spy).toHaveBeenCalledTimes(0);

      tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.MVT,
        spatialDataType: 'geo',
        spatialFilter,
      });
      expect(transformTileCoordsToWGS84Spy).toHaveBeenCalledTimes(0);

      tileFeatures({
        tiles: mockedTile as Tile[],
        tileFormat: TileFormat.MVT,
        spatialDataType: 'geo',
        spatialFilter,
        storeGeometry: true,
      });
      expect(transformTileCoordsToWGS84Spy).toHaveBeenCalled();

      transformTileCoordsToWGS84Spy.mockRestore();
    });
  });
});
