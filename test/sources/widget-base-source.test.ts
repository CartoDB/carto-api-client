import {afterEach, describe, expect, test, vi} from 'vitest';
import {
  MapType,
  Source,
  WidgetBaseSource,
  WidgetBaseSourceProps,
} from '@carto/api-client';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

class WidgetTestSource extends WidgetBaseSource<WidgetBaseSourceProps> {
  protected override getSource(owner: string): Source {
    return {
      ...super.getSource(owner),
      type: 'test' as MapType,
      data: 'test-data',
    };
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('exports', () => {
  expect(WidgetBaseSource).toBeDefined();
});

describe('constructor', () => {
  test('default', () => {
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
    });
    expect(widgetSource).toBeTruthy();
    expect(widgetSource.connectionName).toBe('carto_dw');
    expect(widgetSource.credentials).toMatchObject({accessToken: '<token>'});
    expect(widgetSource.props).toMatchObject({
      accessToken: '<token>',
      connectionName: 'carto_dw',
    });
  });
});

describe('getCategories', () => {
  test('default', async () => {
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
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
      operation: 'count',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualCategories).toEqual(expectedCategories);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'test',
      source: 'test-data',
      params: JSON.stringify({
        column: 'store_type',
        operation: 'count',
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
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
    });

    const expectedFormula = {value: 123};

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({rows: [expectedFormula]}));
    vi.stubGlobal('fetch', mockFetch);

    const actualFormula = await widgetSource.getFormula({
      column: 'store_type',
      operation: 'count',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualFormula).toEqual(expectedFormula);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'test',
      source: 'test-data',
      params: JSON.stringify({
        column: 'store_type',
        operation: 'count',
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getRange', () => {
  test('default', async () => {
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
    });

    const expectedRange = {min: 5, max: 25};

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({rows: [expectedRange]}));
    vi.stubGlobal('fetch', mockFetch);

    const actualRange = await widgetSource.getRange({column: 'employees'});

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualRange).toEqual(expectedRange);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'test',
      source: 'test-data',
      params: JSON.stringify({column: 'employees'}),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getTable', () => {
  test('default', async () => {
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
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
    });

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'test',
      source: 'test-data',
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
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
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
      xAxisJoinOperation: 'count',
      yAxisColumn: 'b',
      yAxisJoinOperation: 'count',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualTable).toEqual(expectedRows.map(Object.values));

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'test',
      source: 'test-data',
      params: JSON.stringify({
        xAxisColumn: 'a',
        xAxisJoinOperation: 'count',
        yAxisColumn: 'b',
        yAxisJoinOperation: 'count',
        limit: 500,
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getTimeSeries', () => {
  test('default', async () => {
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
    });

    const expectedTimeSeries = {
      rows: [
        {name: '2024-01-01', value: 16},
        {name: '2024-01-02', value: 2},
        {name: '2024-01-03', value: 1},
      ],
      categories: ['count of records'],
    };

    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse({
        rows: expectedTimeSeries.rows,
        metadata: {
          categories: expectedTimeSeries.categories,
        },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    const actualTimeSeries = await widgetSource.getTimeSeries({
      column: 'date',
      operation: 'count',
      operationColumn: 'purchases',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualTimeSeries).toEqual(expectedTimeSeries);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'test',
      source: 'test-data',
      params: JSON.stringify({
        column: 'date',
        operationColumn: 'purchases',
        operation: 'count',
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});

describe('getHistogram', () => {
  test('default', async () => {
    const widgetSource = new WidgetTestSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
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
      operation: 'count',
      ticks,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualHistogram).toEqual([...expectedHistogram]);

    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      type: 'test',
      source: 'test-data',
      params: JSON.stringify({
        column: 'a',
        operation: 'count',
        ticks,
      }),
      queryParameters: '',
      filters: JSON.stringify({}),
      filtersLogicalOperator: 'and',
    });
  });
});
