import {WidgetQuerySource, vectorQuerySource} from '@carto/api-client';
import {describe, afterEach, vi, test, expect, beforeEach} from 'vitest';

const CACHE = 'vector-query-source-test';

const INIT_RESPONSE = {
  tilejson: {url: [`https://xyz.com?format=tilejson&cache=${CACHE}`]},
};

const TILESET_RESPONSE = {
  tilejson: '2.2.0',
  tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
  tilestats: {layers: []},
};

describe('vectorQuerySource', () => {
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
    const tilejson = await vectorQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.vector_table',
      columns: ['a', 'b'],
      spatialDataColumn: 'mygeom',
      queryParameters: {type: 'Supermarket', minRevenue: 1000000},
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/query/);
    expect(initURL).toMatch(/q=SELECT\+\*\+FROM\+a\.b\.vector_table/);
    expect(initURL).toMatch(/columns=a%2Cb/);
    expect(initURL).toMatch(/spatialDataColumn=mygeom/);
    expect(initURL).toMatch(/spatialDataType=geo/);
    expect(initURL).toMatch(
      /queryParameters=%7B%22type%22%3A%22Supermarket%22%2C%22minRevenue%22%3A1000000%7D/
    );

    expect(tilesetURL).toMatch(
      /^https:\/\/xyz\.com\/\?format\=tilejson\&cache\=/
    );

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('widgetSource', async () => {
    const {widgetSource} = await vectorQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT *',
    });

    expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
  });
});
