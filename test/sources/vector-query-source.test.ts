import {WidgetQuerySource, vectorQuerySource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {stubGlobalFetchForSource} from '../__mock-fetch.js';

describe('vectorQuerySource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await vectorQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.vector_table',
      columns: ['a', 'b'],
      spatialDataColumn: 'mygeom',
      queryParameters: {type: 'Supermarket', minRevenue: 1000000},
      aggregationExp: 'SUM(revenue)',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/query/);
    expect(initURL).toMatch(/q=SELECT\+\*\+FROM\+a\.b\.vector_table/);
    expect(initURL).toMatch(/columns=a%2Cb/);
    expect(initURL).toMatch(/spatialDataColumn=mygeom/);
    expect(initURL).toMatch(/spatialDataType=geo/);
    expect(initURL).toMatch(/aggregationExp=SUM%28revenue%29/);
    expect(initURL).toMatch(
      /queryParameters=%7B%22type%22%3A%22Supermarket%22%2C%22minRevenue%22%3A1000000%7D/
    );

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('when aggregationExp is not provided', async () => {
    stubGlobalFetchForSource();

    await vectorQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.vector_table',
      columns: ['a', 'b'],
      spatialDataColumn: 'mygeom',
      queryParameters: {type: 'Supermarket', minRevenue: 1000000},
    });

    const [[initURL]] = vi.mocked(fetch).mock.calls;
    expect(initURL).not.toContain('aggregationExp');
  });

  test('widgetSource', async () => {
    stubGlobalFetchForSource();

    const {widgetSource} = await vectorQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT *',
    });

    expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
  });
});
