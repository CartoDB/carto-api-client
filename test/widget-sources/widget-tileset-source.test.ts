import {describe, it, expect, beforeEach} from 'vitest';
import {
  TileFormat,
  WidgetTilesetSource,
  createViewportSpatialFilter,
} from '@carto/api-client';
import {MOCK_GEOJSON} from './__mock-geojson.js';
import type {BBox} from 'geojson';

let source: WidgetTilesetSource;

const MOCK_COLUMNS = Object.keys(MOCK_GEOJSON.features[0].properties);
const MOCK_SPATIAL_FILTER = createViewportSpatialFilter([-175, 85, 175, -85]);
const MOCK_BOUNDS = [-9.2, 37.5, 1.0, 43.5] as BBox;

beforeEach(() => {
  source = new WidgetTilesetSource({
    connectionName: 'test-connection',
    tableName: 'test-table',
    accessToken: '••••',
    tileFormat: TileFormat.BINARY,
    spatialDataType: 'geo',
    spatialDataBounds: MOCK_BOUNDS,
  });

  source.loadGeoJSON({
    geojson: MOCK_GEOJSON,
    spatialFilter: MOCK_SPATIAL_FILTER,
  });
});

describe('getCategories', () => {
  it('counts features in categories', async () => {
    expect(
      await source.getCategories({
        column: 'storetype',
        operation: 'count',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual([
      {
        name: 'Drugstore',
        value: 6,
      },
    ]);
  });

  it('counts features in categories - operationColumn=""', async () => {
    expect(
      await source.getCategories({
        column: 'storetype',
        operation: 'count',
        // For backward compatibility, '' should pass column validation. For
        // operations other than 'count', its behavior is undefined.
        operationColumn: '',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual([
      {
        name: 'Drugstore',
        value: 6,
      },
    ]);
  });

  it('computes max in categories', async () => {
    expect(
      await source.getCategories({
        column: 'storetype',
        operation: 'max',
        operationColumn: 'revenue',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual([
      {
        name: 'Drugstore',
        value: 1876776,
      },
    ]);
  });
});

describe('getFeatures', () => {
  it('not implemented', async () => {
    await expect(() => source.getFeatures()).rejects.toThrow(/not supported/);
  });
});

describe('getFormula', () => {
  it('counts features', async () => {
    expect(
      await source.getFormula({
        operation: 'count',
        column: undefined,
        joinOperation: undefined,
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual({value: 6});
  });

  it('counts features with filter', async () => {
    source = new WidgetTilesetSource({
      ...source.props,
      filters: {
        city: {
          in: {
            owner: 'widgetId1',
            values: ['BOSTON'],
          },
        },
      },
    });

    source.loadGeoJSON({
      geojson: MOCK_GEOJSON,
      spatialFilter: MOCK_SPATIAL_FILTER,
    });

    expect(
      await source.getFormula({
        column: undefined,
        joinOperation: undefined,
        operation: 'count',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual({
      value: 3,
    });
  });
});

describe('getHistogram', () => {
  it('creates histogram', async () => {
    expect(
      await source.getHistogram({
        column: 'revenue',
        operation: 'count',
        ticks: [997472.3, 1716077, 2056468.7],
        joinOperation: undefined,
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual([0, 4, 2, 0]);
  });
});

describe('getRange', () => {
  it('computes ranges', async () => {
    expect(
      await source.getRange({
        column: 'revenue',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual({
      min: 1254145,
      max: 1876776,
    });
  });
});

describe('getScatter', () => {
  it('computes scatterplot points', async () => {
    expect(
      await source.getScatter({
        xAxisColumn: 'size_m2',
        yAxisColumn: 'revenue',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual([
      [846, 1301427],
      [809, 1646773],
      [129, 1449786],
      [954, 1876776],
      [737, 1254145],
      [103, 1866052],
    ]);
  });
});

describe('getTable', () => {
  it('returns all features properties in unspecified order', async () => {
    expect(
      await source.getTable({
        columns: MOCK_COLUMNS,
        sortBy: undefined,
        sortDirection: undefined,
        sortByColumnType: undefined,
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual({
      totalCount: 6,
      rows: MOCK_GEOJSON.features.map((f) => f.properties),
    });
  });

  it('returns all features properties in specified order', async () => {
    expect(
      await source.getTable({
        columns: MOCK_COLUMNS,
        sortBy: 'size_m2',
        sortDirection: 'desc',
        sortByColumnType: 'number',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual({
      totalCount: 6,
      rows: MOCK_GEOJSON.features
        .map((f) => f.properties)
        .sort((a, b) => b.size_m2 - a.size_m2),
    });
  });

  it('should not filter when searchFilterColumn is provided, but searchFilterText is not', async () => {
    expect(
      await source.getTable({
        columns: MOCK_COLUMNS,
        searchFilterColumn: 'address',
        searchFilterText: null,
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual({
      totalCount: 6,
      rows: MOCK_GEOJSON.features.map((f) => f.properties),
    });
  });

  it('should not filter when searchFilterText is provided, but searchFilterColumn is not', async () => {
    expect(
      await source.getTable({
        columns: MOCK_COLUMNS,
        searchFilterColumn: null,
        searchFilterText: 'any-text',
        spatialFilter: MOCK_SPATIAL_FILTER,
      })
    ).toEqual({
      totalCount: 6,
      rows: MOCK_GEOJSON.features.map((f) => f.properties),
    });
  });

  it('should filter when searchFilterColumn and searchFilterText are provided', async () => {
    const result = await source.getTable({
      columns: MOCK_COLUMNS,
      searchFilterColumn: 'address',
      searchFilterText: '146 tremont st',
      spatialFilter: MOCK_SPATIAL_FILTER,
    });

    expect(result).toEqual({
      totalCount: 1,
      rows: [MOCK_GEOJSON.features[0].properties],
    });
  });
});

describe('getExtent', () => {
  it('should return TileJSON bounds', async () => {
    const result = await source.getExtent();
    expect(result).toEqual({bbox: MOCK_BOUNDS});
  });
});

describe('getAggregations', () => {
  it('should handle count operation with * column', async () => {
    const result = await source.getAggregations({
      aggregations: [{column: '*', operation: 'count', alias: 'RECORD_COUNT'}],
      spatialFilter: MOCK_SPATIAL_FILTER,
    });

    expect(result).toEqual({
      rows: [
        {
          RECORD_COUNT: expect.any(Number),
        },
      ],
    });
    expect(result.rows[0].RECORD_COUNT).toBeGreaterThan(0);
  });

  it('should return aggregations with specified aliases', async () => {
    const result = await source.getAggregations({
      aggregations: [
        {column: 'revenue', operation: 'sum', alias: 'Total_Revenue'},
        {column: 'size_m2', operation: 'avg', alias: 'AVG_Size'},
        {column: '*', operation: 'count', alias: 'RECORD_COUNT'},
      ],
      spatialFilter: MOCK_SPATIAL_FILTER,
    });

    // For tileset sources, aggregations are calculated locally
    // and aliases are returned exactly as specified
    expect(result).toEqual({
      rows: [
        {
          Total_Revenue: expect.any(Number),
          AVG_Size: expect.any(Number),
          RECORD_COUNT: expect.any(Number),
        },
      ],
    });

    // Verify that it returns valid numeric values
    expect(result.rows[0].Total_Revenue).toBeGreaterThan(0);
    expect(result.rows[0].AVG_Size).toBeGreaterThan(0);
    expect(result.rows[0].RECORD_COUNT).toBeGreaterThan(0);
  });

  it('should throw error for custom operation', async () => {
    // Although TypeScript already prevents this at compile-time, we verify at runtime
    await expect(async () => {
      await source.getAggregations({
        aggregations: [
          {
            column: 'revenue',
            operation: 'custom' as any,
            alias: 'custom_result',
          },
        ],
        spatialFilter: MOCK_SPATIAL_FILTER,
      });
    }).rejects.toThrow(/custom/i);
  });

  it('should throw error for string-based aggregations (not supported)', async () => {
    // Tilesets do not support string-based aggregations because they require SQL
    await expect(async () => {
      await source.getAggregations({
        aggregations:
          'sum(revenue) as total_revenue, avg(size_m2) as avg_size' as any,
        spatialFilter: MOCK_SPATIAL_FILTER,
      });
    }).rejects.toThrow(/sql/i);
  });
});
