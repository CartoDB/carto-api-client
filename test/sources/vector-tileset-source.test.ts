import {vectorTilesetSource, WidgetTilesetSource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {stubGlobalFetchForSource} from '../__mock-fetch.js';

describe('vectorTilesetSource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await vectorTilesetSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.vector_tileset',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/tileset/);
    expect(initURL).toMatch(/name=a\.b\.vector_tileset/);

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('widgetSource', async () => {
    stubGlobalFetchForSource();

    const {widgetSource} = await vectorTilesetSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      tableName: 'a.b.vector_tileset',
    });

    expect(widgetSource).toBeInstanceOf(WidgetTilesetSource);
  });
});
