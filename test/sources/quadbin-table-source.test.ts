import {WidgetTableSource, quadbinTableSource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {
  MOCK_INIT_RESPONSE,
  MOCK_TILESET_RESPONSE,
  stubGlobalFetchForSource,
} from '../__mock-fetch.js';

describe('quadbinTableSource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await quadbinTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.quadbin_table',
      aggregationExp: 'SUM(population) as pop',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/table/);
    expect(initURL).toMatch(/aggregationExp=SUM%28population%29\+as\+pop/);
    expect(initURL).toMatch(/spatialDataColumn=quadbin/);
    expect(initURL).toMatch(/spatialDataType=quadbin/);
    expect(initURL).toMatch(/name=a.b.quadbin_table/);

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('widgetSource', async () => {
    stubGlobalFetchForSource();

    const {widgetSource} = await quadbinTableSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      tableName: 'my-table',
      aggregationExp: 'COUNT (*)',
    });

    expect(widgetSource).toBeInstanceOf(WidgetTableSource);
  });

  test('widgetSource + dynamic point aggregation', async () => {
    stubGlobalFetchForSource(MOCK_INIT_RESPONSE, {
      ...MOCK_TILESET_RESPONSE,
      schema: [{name: 'geom', type: 'geometry'}],
    });

    const {widgetSource} = await quadbinTableSource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      tableName: 'my-table',
      aggregationExp: 'COUNT (*)',
      spatialDataColumn: 'geom',
    });

    expect(widgetSource).toBeInstanceOf(WidgetTableSource);
    expect(widgetSource.props.spatialDataType).toBe('geo'); // not 'quadbin'
  });
});
