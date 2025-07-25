import {expect, test, vi} from 'vitest';
import {
  Filters,
  FilterType,
  setClient,
  WidgetRemoteSource,
  WidgetRemoteSourceProps,
} from '@carto/api-client';
import type {BBox} from 'geojson';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

class WidgetTestSource extends WidgetRemoteSource<WidgetRemoteSourceProps> {
  protected override getModelSource(filters: Filters, filterOwner: string) {
    return {
      ...super._getModelSource(filters, filterOwner),
      type: 'test',
      data: 'test-data',
    } as unknown as ReturnType<
      WidgetRemoteSource<WidgetRemoteSourceProps>['getModelSource']
    >;
  }
}

test('exports', () => {
  expect(WidgetRemoteSource).toBeDefined();
});

test('constructor', () => {
  const widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
  });
  expect(widgetSource).toBeTruthy();
  expect(widgetSource.props).toMatchObject({
    accessToken: '<token>',
    connectionName: 'carto_dw',
  });
});

test('clientId', () => {
  const clientIds = ['deck-gl-carto', 'new-default', 'override-default'];

  const widgetSource0 = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
  });

  setClient(clientIds[1]);

  const widgetSource1 = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
  });

  const widgetSource2 = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    clientId: clientIds[2],
  });

  expect(widgetSource0.props.clientId).toBe(clientIds[0]);
  expect(widgetSource1.props.clientId).toBe(clientIds[1]);
  expect(widgetSource2.props.clientId).toBe(clientIds[2]);
});

test('setRequestHeaders', async () => {
  const mockResponse = createMockResponse({rows: []});
  const mockFetch = vi.fn().mockResolvedValue(mockResponse);
  vi.stubGlobal('fetch', mockFetch);

  let widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
  });

  await widgetSource.getFormula({column: 'store_name', operation: 'count'});

  expect(mockFetch).toHaveBeenCalledOnce();
  expect(mockFetch.mock.lastCall[1].headers).toEqual({
    Authorization: 'Bearer <token>',
  });

  widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    headers: {'Cache-Control': 'public'},
  });

  await widgetSource.getFormula({column: 'store_name', operation: 'count'});

  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(mockFetch.mock.lastCall[1].headers).toEqual({
    Authorization: 'Bearer <token>',
    'Cache-Control': 'public',
  });
});

/******************************************************************************
 * getCategories
 */

test('getCategories', async () => {
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
    operation: 'custom',
    operationExp: 'count(store_type) / 2',
  });

  expect(mockFetch).toHaveBeenCalledOnce();
  expect(actualCategories).toEqual(expectedCategories);

  const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
  expect(Object.fromEntries(params)).toMatchObject({
    type: 'test',
    source: 'test-data',
    params: JSON.stringify({
      column: 'store_type',
      operation: 'custom',
      operationExp: 'count(store_type) / 2',
      operationColumn: 'store_type',
    }),
    queryParameters: '',
    filters: JSON.stringify({}),
    filtersLogicalOperator: 'and',
  });
});

/******************************************************************************
 * filters
 */

test('filters - global', async () => {
  // Filters without 'owners' must affect API calls with or without
  // a 'filterOwner' assigned. When 'filterOwner' is null, undefined,
  // or an empty string, all filters are applied.

  const widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    filters: {country: {[FilterType.IN]: {values: ['Spain']}}},
  });

  const mockFetch = vi
    .fn()
    .mockResolvedValue(createMockResponse({rows: [{value: 123}]}));

  vi.stubGlobal('fetch', mockFetch);

  const expectedParams = {
    filters: JSON.stringify({country: {in: {values: ['Spain']}}}),
    filtersLogicalOperator: 'and',
  };

  expect(await getActualParams('mywidget')).toMatchObject(expectedParams);
  expect(await getActualParams(null)).toMatchObject(expectedParams);
  expect(await getActualParams(undefined)).toMatchObject(expectedParams);
  expect(await getActualParams('')).toMatchObject(expectedParams);

  async function getActualParams(
    filterOwner: string | null | undefined
  ): Promise<Record<string, string>> {
    await widgetSource.getFormula({
      column: 'store_name',
      operation: 'count',
      filterOwner,
    });
    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    return Object.fromEntries(params);
  }
});

test('filters - override', async () => {
  // Filters on the datasource may be overridden by filters passed
  // to widget function calls.

  const widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    filters: {country: {[FilterType.IN]: {values: ['Spain']}}},
  });

  const mockFetch = vi
    .fn()
    .mockResolvedValue(createMockResponse({rows: [{value: 123}]}));

  vi.stubGlobal('fetch', mockFetch);

  await widgetSource.getFormula({
    column: 'store_name',
    operation: 'count',
    filters: {continent: {[FilterType.IN]: {values: ['Europe']}}},
  });

  const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();

  expect(Object.fromEntries(params)).toMatchObject({
    filters: JSON.stringify({continent: {in: {values: ['Europe']}}}),
    filtersLogicalOperator: 'and',
  });
});

test('filters - owner', async () => {
  // Filters with 'owner' must affect all API calls *except*
  // those with a matching 'filterOwner'. When 'owner' is null,
  // undefined, or an empty string, it affects all calls.

  const filters = {
    a: {
      [FilterType.IN]: {
        owner: 'a',
        values: [1, 2, 3],
      },
    },
    b: {
      [FilterType.IN]: {
        owner: 'b',
        values: [4, 5, 6],
      },
    },
    c: {
      [FilterType.IN]: {
        owner: null,
        values: [7, 8, 9],
      },
    },
    d: {
      [FilterType.IN]: {
        owner: undefined,
        values: [10, 11, 12],
      },
    },
    e: {
      [FilterType.IN]: {
        owner: '',
        values: [13, 14, 15],
      },
    },
  };

  const widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    filters,
  });

  const mockFetch = vi
    .fn()
    .mockResolvedValue(createMockResponse({rows: [{value: 123}]}));

  vi.stubGlobal('fetch', mockFetch);

  expect(await getActualParams('a')).toMatchObject({
    filters: JSON.stringify({
      ...filters,
      a: undefined,
    }),
    filtersLogicalOperator: 'and',
  });

  expect(await getActualParams('b')).toMatchObject({
    filters: JSON.stringify({
      ...filters,
      b: undefined,
    }),
    filtersLogicalOperator: 'and',
  });

  expect(await getActualParams('c')).toMatchObject({
    filters: JSON.stringify(filters),
    filtersLogicalOperator: 'and',
  });

  expect(await getActualParams('d')).toMatchObject({
    filters: JSON.stringify(filters),
    filtersLogicalOperator: 'and',
  });

  expect(await getActualParams('e')).toMatchObject({
    filters: JSON.stringify(filters),
    filtersLogicalOperator: 'and',
  });

  async function getActualParams(
    filterOwner: string | null | undefined
  ): Promise<Record<string, string>> {
    await widgetSource.getFormula({
      column: 'store_name',
      operation: 'count',
      filterOwner,
    });
    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    return Object.fromEntries(params);
  }
});

/******************************************************************************
 * getFeatures
 */

test('getFeatures', async () => {
  const widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
  });

  const expectedRows = [
    {
      _carto_feature_id: 'a',
      name: 'Veggie Mart',
      revenue: 1200,
      CaseSensitive: 1,
    },
    {
      _carto_feature_id: 'b',
      name: 'EZ Drive Thru',
      revenue: 400,
      CaseSensitive: 2,
    },
    {
      _carto_feature_id: 'c',
      name: "Buddy's Convenience",
      revenue: 800,
      CaseSensitive: 3,
    },
  ];

  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce(
      createMockResponse({rows: expectedRows, meta: {foo: 'bar'}})
    );
  vi.stubGlobal('fetch', mockFetch);

  const actualFeatures = await widgetSource.getFeatures({
    columns: ['_carto_feature_id', 'name', 'revenue', 'CaseSensitive'],
    featureIds: ['a', 'b', 'c'],
    dataType: 'points',
  });

  expect(mockFetch).toHaveBeenCalledOnce();
  expect(actualFeatures).toEqual({rows: expectedRows});

  const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
  expect(Object.fromEntries(params)).toMatchObject({
    type: 'test',
    source: 'test-data',
    params: JSON.stringify({
      columns: ['_carto_feature_id', 'name', 'revenue', 'CaseSensitive'],
      dataType: 'points',
      featureIds: ['a', 'b', 'c'],
      limit: 1000,
      tileResolution: 0.5,
    }),
    queryParameters: '',
    filters: JSON.stringify({}),
    filtersLogicalOperator: 'and',
  });
});

/******************************************************************************
 * getFormula
 */

test('getFormula', async () => {
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

/******************************************************************************
 * getRange
 */

test('getRange', async () => {
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

/******************************************************************************
 * getTable
 */

test('getTable', async () => {
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
    limit: 20,
    offset: 10,
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
      limit: 20,
      offset: 10,
    }),
    queryParameters: '',
    filters: JSON.stringify({}),
    filtersLogicalOperator: 'and',
  });
});

test('getTable - snowflake', async () => {
  const widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
  });

  const expectedRows = [
    {name: 'Veggie Mart', rEVenUe: 1200},
    {name: 'EZ Drive Thru', rEVenUe: 400},
    {name: "Buddy's Convenience", rEVenUe: 800},
  ];

  // NOTICE: Snowflake returns uppercase keys.
  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce(
      createMockResponse({ROWS: expectedRows, METADATA: {TOTAL: 3}})
    );
  vi.stubGlobal('fetch', mockFetch);

  const actualTable = await widgetSource.getTable({
    columns: ['name', 'revenue'],
    limit: 20,
    offset: 10,
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
      limit: 20,
      offset: 10,
    }),
    queryParameters: '',
    filters: JSON.stringify({}),
    filtersLogicalOperator: 'and',
  });
});

/******************************************************************************
 * getScatter
 */

test('getScatter', async () => {
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

/******************************************************************************
 * getTimeSeries
 */

test('getTimeSeries', async () => {
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
    stepSize: 'month',
    operation: 'custom',
    operationExp: 'count(purchases) * 2',
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
      stepSize: 'month',
      operationColumn: 'purchases',
      operation: 'custom',
      operationExp: 'count(purchases) * 2',
    }),
    queryParameters: '',
    filters: JSON.stringify({}),
    filtersLogicalOperator: 'and',
  });
});

/******************************************************************************
 * getHistogram
 */

test('getHistogram', async () => {
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

/******************************************************************************
 * getExtent
 */

test('getExtent', async () => {
  const widgetSource = new WidgetTestSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    apiBaseUrl: 'https://api.example.com',
    spatialDataColumn: 'my_geom',
  });

  const bbox = [-9.2, 37.5, 1.0, 43.5] as BBox;
  const [xmin, ymin, xmax, ymax] = bbox;

  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce(
      createMockResponse({extent: {xmin, ymin, xmax, ymax}})
    );
  vi.stubGlobal('fetch', mockFetch);

  const result = await widgetSource.getExtent();
  expect(result).toEqual({bbox});

  expect(mockFetch).toHaveBeenCalledExactlyOnceWith(
    expect.stringMatching(
      'https://api.example.com/v3/stats/carto_dw/test-data/my_geom'
    ),
    expect.objectContaining({
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer <token>',
        'Content-Type': 'application/json',
      },
    })
  );
});
