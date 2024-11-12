import {WidgetTableSource, h3TableSource} from '@carto/api-client';
import {describe, afterEach, vi, test, expect, beforeEach} from 'vitest';

const CACHE = 'h3-table-source-test';

const INIT_RESPONSE = {
  tilejson: {url: [`https://xyz.com?format=tilejson&cache=${CACHE}`]},
};

const TILESET_RESPONSE = {
  tilejson: '2.2.0',
  tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
  tilestats: {layers: []},
};

describe('h3TableSource', () => {
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
    const tilejson = await h3TableSource({
      connectionName: 'carto_dw',
      clientId: 'CUSTOM_CLIENT',
      accessToken: '<token>',
      tableName: 'a.b.h3_table',
      aggregationExp: 'SUM(population) as pop',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/table/);
    expect(initURL).toMatch(/aggregationExp=SUM%28population%29\+as\+pop/);
    expect(initURL).toMatch(/spatialDataColumn=h3/);
    expect(initURL).toMatch(/spatialDataType=h3/);
    expect(initURL).toMatch(/name=a.b.h3_table/);
    expect(initURL).toMatch(/client\=CUSTOM_CLIENT/);

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
    const {widgetSource} = await h3TableSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      tableName: 'my-table',
      aggregationExp: 'COUNT (*)',
    });

    expect(widgetSource).toBeInstanceOf(WidgetTableSource);
  });
});
