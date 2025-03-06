import {expect, test, vi} from 'vitest';
import {WidgetQuerySource} from '@carto/api-client';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

test('exports', () => {
  expect(WidgetQuerySource).toBeDefined();
});

test('constructor', () => {
  const widgetSource = new WidgetQuerySource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    sqlQuery: 'SELECT * FROM my-table',
  });
  expect(widgetSource).toBeTruthy();
  expect(widgetSource.props).toMatchObject({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    sqlQuery: 'SELECT * FROM my-table',
  });
});

test('getModelSource', async () => {
  const widgetSource = new WidgetQuerySource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    sqlQuery: 'SELECT * FROM my-table',
    queryParameters: [2.5],
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
    type: 'query',
    source: 'SELECT * FROM my-table',
    params: JSON.stringify({
      column: 'store_type',
      operation: 'count',
    }),
    queryParameters: '[2.5]',
    filters: JSON.stringify({}),
    filtersLogicalOperator: 'and',
  });
});
