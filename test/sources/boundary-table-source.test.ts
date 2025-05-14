import {boundaryTableSource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {stubGlobalFetchForSource} from '../__mock-fetch.js';

describe('boundaryTableSource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await boundaryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tilesetTableName: 'a.b.tileset_table',
      columns: ['column1', 'column2'],
      propertiesTableName: 'a.b.properties_table',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/boundary/);
    expect(initURL).toMatch(/tilesetTableName=a.b.tileset_table/);
    expect(initURL).toMatch(/propertiesTableName=a.b.properties_table/);
    expect(initURL).toMatch(/columns=column1%2Ccolumn2/);

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });
});
