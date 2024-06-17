import {afterEach, describe, expect, test, vi} from 'vitest';
import {AggregationTypes, WidgetQuerySource} from '@carto/core';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('exports', () => {
  expect(WidgetQuerySource).toBeDefined();
});

describe('constructor', () => {
  test('default', () => {
    const widgetSource = new WidgetQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT * FROM my-table',
    });
    expect(widgetSource).toBeTruthy();
    expect(widgetSource.connectionName).toBe('carto_dw');
    expect(widgetSource.credentials).toMatchObject({accessToken: '<token>'});
    expect(widgetSource.props).toMatchObject({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT * FROM my-table',
    });
  });
});

describe('getCategories', () => {
  test('default', async () => {
    const widgetSource = new WidgetQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT * FROM my-table',
    });

    const expectedCategories = [
      {name: 'retail', value: 16},
      {name: 'grocery', value: 2},
      {name: 'gas', value: 1},
    ];

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({rows: expectedCategories}));
    vi.stubGlobal('fetch', mockFetch);

    const actualCategories = await widgetSource.getCategories({
      column: 'store_type',
      operation: AggregationTypes.COUNT,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualCategories).toEqual(expectedCategories);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'query',
      source: 'SELECT * FROM my-table',
      params: JSON.stringify({
        column: 'store_type',
        operation: AggregationTypes.COUNT,
        operationColumn: 'store_type',
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getFormula', () => {
  test('default', async () => {
    const widgetSource = new WidgetQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT * FROM my-table',
    });

    const expectedFormula = {value: 123};

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({rows: [expectedFormula]}));
    vi.stubGlobal('fetch', mockFetch);

    const actualFormula = await widgetSource.getFormula({
      column: 'store_type',
      operation: AggregationTypes.COUNT,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualFormula).toEqual(expectedFormula);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'query',
      source: 'SELECT * FROM my-table',
      params: JSON.stringify({
        column: 'store_type',
        operation: AggregationTypes.COUNT,
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getRange', () => {
  test.todo('default', async () => {});
});

describe('getTable', () => {
  test('default', async () => {
    const widgetSource = new WidgetQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT * FROM my-table',
    });

    const expectedRows = [
      {name: 'Veggie Mart', revenue: 1200},
      {name: 'EZ Drive Thru', revenue: 400},
      {name: "Buddy's Convenience", revenue: 800},
    ];

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        createMockResponse({rows: expectedRows, metadata: {total: 3}})
      );
    vi.stubGlobal('fetch', mockFetch);

    const actualTable = await widgetSource.getTable({
      columns: ['name', 'revenue'],
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualTable).toEqual({
      rows: expectedRows,
      totalCount: 3,
      hasData: true,
    });

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'query',
      source: 'SELECT * FROM my-table',
      params: JSON.stringify({
        column: ['name', 'revenue'],
        limit: 10,
        offset: 0,
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getScatter', () => {
  test('default', async () => {
    const widgetSource = new WidgetQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT * FROM my-table',
    });

    const expectedRows = [
      {x: 1, y: 2},
      {x: 3, y: 4},
      {x: 5, y: 6},
    ];

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({rows: expectedRows}));
    vi.stubGlobal('fetch', mockFetch);

    const actualTable = await widgetSource.getScatter({
      xAxisColumn: 'a',
      xAxisJoinOperation: AggregationTypes.COUNT,
      yAxisColumn: 'b',
      yAxisJoinOperation: AggregationTypes.COUNT,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualTable).toEqual(expectedRows.map(Object.values));

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'query',
      source: 'SELECT * FROM my-table',
      params: JSON.stringify({
        xAxisColumn: 'a',
        xAxisJoinOperation: AggregationTypes.COUNT,
        yAxisColumn: 'b',
        yAxisJoinOperation: AggregationTypes.COUNT,
        limit: 500,
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getTimeSeries', () => {
  test.todo('default', async () => {});
});

describe('getHistogram', () => {
  test('default', async () => {
    const widgetSource = new WidgetQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT * FROM my-table',
    });

    // Given N ticks, API returns N+1 bins. One bin before,
    // N-1 bins between ticks, and one bin after.
    const ticks = [50, 100, 200];
    const expectedHistogram = [10, 5, 15, 12];

    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse({
        rows: expectedHistogram.map((value, index) => ({
          tick: index,
          value,
        })),
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    const actualHistogram = await widgetSource.getHistogram({
      column: 'a',
      operation: AggregationTypes.COUNT,
      ticks,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualHistogram).toEqual([...expectedHistogram]);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'query',
      source: 'SELECT * FROM my-table',
      params: JSON.stringify({
        column: 'a',
        operation: AggregationTypes.COUNT,
        ticks,
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});
