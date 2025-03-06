import {quadbinTilesetSource} from '@carto/api-client';
import {describe, vi, test, expect, beforeEach} from 'vitest';

const CACHE = 'quadbin-tileset-source-test';

const INIT_RESPONSE = {
  tilejson: {url: [`https://xyz.com?format=tilejson&cache=${CACHE}`]},
};

const TILESET_RESPONSE = {
  tilejson: '2.2.0',
  tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
  tilestats: {layers: []},
};

describe('quadbinTilesetSource', () => {
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

  test('default', async () => {
    const tilejson = await quadbinTilesetSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.quadbin_tileset',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/tileset/);
    expect(initURL).toMatch(/name=a.b.quadbin_tileset/);

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson&cache=/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });
});
