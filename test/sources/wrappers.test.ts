import {afterEach, expect, test, vi} from 'vitest';
import {
  vectorQuerySource,
  vectorTableSource,
  h3QuerySource,
  h3TableSource,
  quadbinQuerySource,
  quadbinTableSource,
  WidgetQuerySource,
  WidgetTableSource,
} from '@carto/api-client';

const createMockFetchForTileJSON = () =>
  vi
    .fn()
    .mockResolvedValueOnce(
      createMockFetchResponse({label: 'mapInit', tilejson: {url: ''}})
    )
    .mockResolvedValueOnce(
      createMockFetchResponse({label: 'tilejson', tilejson: {url: ''}})
    );

const createMockFetchResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/******************************************************************************
 * VECTOR SOURCES
 */

test('vectorQuerySource', async () => {
  vi.stubGlobal('fetch', createMockFetchForTileJSON());

  const {widgetSource} = await vectorQuerySource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    sqlQuery: 'SELECT *',
  });

  expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
});

test('vectorTableSource', async () => {
  vi.stubGlobal('fetch', createMockFetchForTileJSON());

  const {widgetSource} = await vectorTableSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    tableName: 'my-table',
  });

  expect(widgetSource).toBeInstanceOf(WidgetTableSource);
});

/******************************************************************************
 * H3 SOURCES
 */

test('h3QuerySource', async () => {
  vi.stubGlobal('fetch', createMockFetchForTileJSON());

  const {widgetSource} = await h3QuerySource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    sqlQuery: 'SELECT *',
    aggregationExp: 'COUNT (*)',
  });

  expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
});

test('h3TableSource', async () => {
  vi.stubGlobal('fetch', createMockFetchForTileJSON());

  const {widgetSource} = await h3TableSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    tableName: 'my-table',
    aggregationExp: 'COUNT (*)',
  });

  expect(widgetSource).toBeInstanceOf(WidgetTableSource);
});

/******************************************************************************
 * QUADBIN SOURCES
 */

test('quadbinQuerySource', async () => {
  vi.stubGlobal('fetch', createMockFetchForTileJSON());

  const {widgetSource} = await quadbinQuerySource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    sqlQuery: 'SELECT *',
    aggregationExp: 'COUNT (*)',
  });

  expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
});

test('quadbinTableSource', async () => {
  vi.stubGlobal('fetch', createMockFetchForTileJSON());

  const {widgetSource} = await quadbinTableSource({
    accessToken: '<token>',
    connectionName: 'carto_dw',
    tableName: 'my-table',
    aggregationExp: 'COUNT (*)',
  });

  expect(widgetSource).toBeInstanceOf(WidgetTableSource);
});
