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
