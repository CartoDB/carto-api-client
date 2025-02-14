import {WidgetTableSource, vectorTableSource} from '@carto/api-client';
import {describe, afterEach, vi, test, expect, beforeEach} from 'vitest';

const CACHE = 'vector-table-source-test';

const INIT_RESPONSE = {
  tilejson: {url: [`https://xyz.com?format=tilejson&cache=${CACHE}`]},
};

const TILESET_RESPONSE = {
  tilejson: '2.2.0',
  tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
  tilestats: {layers: []},
};

describe('vectorTableSource', () => {
  beforeEach(() => {
    const mockFetch = vi
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({ok: true, json: () => Promise.resolve(INIT_RESPONSE)})
      )
      .mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(TILESET_RESPONSE),
        })
      );

    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => void vi.restoreAllMocks());

  test('default', async () => {
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
    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson&cache=/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('when aggregationExp is not provided', async () => {
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
    const {widgetSource} = await vectorTableSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      tableName: 'my-table',
    });

    expect(widgetSource).toBeInstanceOf(WidgetTableSource);
  });
});
