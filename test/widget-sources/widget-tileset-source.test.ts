import {describe, it, expect, beforeEach} from 'vitest';
import {
  TileFormat,
  WidgetTilesetSource,
  createViewportSpatialFilter,
} from '@carto/api-client';
import {MOCK_GEOJSON} from './__mock-geojson.js';

let source: WidgetTilesetSource;

const MOCK_COLUMNS = Object.keys(MOCK_GEOJSON.features[0].properties);
const MOCK_SPATIAL_FILTER = createViewportSpatialFilter([-175, 85, 175, -85]);

beforeEach(() => {
  source = new WidgetTilesetSource({
    connectionName: 'test-connection',
    tableName: 'test-table',
    accessToken: '••••',
    tileFormat: TileFormat.BINARY,
    spatialDataType: 'geo',
  });

  source.loadGeoJSON({
    geojson: MOCK_GEOJSON,
    spatialFilter: MOCK_SPATIAL_FILTER,
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
