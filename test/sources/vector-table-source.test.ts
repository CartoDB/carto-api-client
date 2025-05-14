import {WidgetTableSource, vectorTableSource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {stubGlobalFetchForSource} from '../__mock-fetch.js';

describe('vectorTableSource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await vectorTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.vector_table',
      columns: ['a', 'b'],
      spatialDataColumn: 'mygeom',
      aggregationExp: 'SUM(revenue)',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/table/);
    expect(initURL).toMatch(/name=a\.b\.vector_table/);
    expect(initURL).toMatch(/columns=a%2Cb/);
    expect(initURL).toMatch(/spatialDataColumn=mygeom/);
    expect(initURL).toMatch(/spatialDataType=geo/);
    expect(initURL).toMatch(/aggregationExp=SUM%28revenue%29/);
    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('when aggregationExp is not provided', async () => {
    stubGlobalFetchForSource();

    await vectorTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.vector_table',
      columns: ['a', 'b'],
      spatialDataColumn: 'mygeom',
    });

    const [[initURL]] = vi.mocked(fetch).mock.calls;
    expect(initURL).not.toContain('aggregationExp');
  });

  test('widgetSource', async () => {
    stubGlobalFetchForSource();

    const {widgetSource} = await vectorTableSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      tableName: 'my-table',
    });

    expect(widgetSource).toBeInstanceOf(WidgetTableSource);
  });
});
