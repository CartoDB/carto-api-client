import {expect, test, vi} from 'vitest';
import {WidgetTableSource} from '@carto/api-client';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

test('exports', () => {
  expect(WidgetTableSource).toBeDefined();
});

test('constructor', () => {
  const widgetSource = new WidgetTableSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    tableName: 'my-table',
  });
  expect(widgetSource).toBeTruthy();
  expect(widgetSource.props).toMatchObject({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    tableName: 'my-table',
  });
});

test('getModelSource', async () => {
  const widgetSource = new WidgetTableSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    tableName: 'my-table',
  });

  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce(createMockResponse({rows: [{value: 123}]}));

  vi.stubGlobal('fetch', mockFetch);

  await widgetSource.getFormula({
    column: 'store_type',
    operation: 'count',
  });

  expect(mockFetch).toHaveBeenCalledOnce();

  const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
  expect(Object.fromEntries(params)).toMatchObject({
    type: 'table',
    source: 'my-table',
    params: JSON.stringify({
      column: 'store_type',
      operation: 'count',
    }),
    filters: JSON.stringify({}),
    filtersLogicalOperator: 'and',
  });
});

test('getFormula - spatial index filter', async () => {
  const widgetSource = new WidgetTableSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    tableName: 'my-h3-table',
    spatialDataType: 'h3',
    spatialDataColumn: 'h3',
  });

  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce(createMockResponse({rows: [{value: 123}]}));

  vi.stubGlobal('fetch', mockFetch);

  await widgetSource.getFormula({
    column: 'population',
    operation: 'sum',
    spatialFilter: {
      indexes: ['8a2a1072b59ffff', '8a2a1072b5bffff'],
      type: 'h3',
    },
  });

  expect(mockFetch).toHaveBeenCalledOnce();

  const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
  expect(Object.fromEntries(params)).toMatchObject({
    type: 'table',
    source: 'my-h3-table',
    spatialDataType: 'h3',
    spatialDataColumn: 'h3',
    spatialFilters: JSON.stringify({
      h3: {indexes: ['8a2a1072b59ffff', '8a2a1072b5bffff'], type: 'h3'},
    }),
  });
});
