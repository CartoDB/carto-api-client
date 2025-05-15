import {WidgetQuerySource, quadbinQuerySource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {
  MOCK_INIT_RESPONSE,
  MOCK_TILESET_RESPONSE,
  stubGlobalFetchForSource,
} from '../__mock-fetch.js';

describe('quadbinQuerySource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await quadbinQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.quadbin_table',
      aggregationExp: 'SUM(population) as pop',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/query/);
    expect(initURL).toMatch(/aggregationExp=SUM%28population%29\+as\+pop/);
    expect(initURL).toMatch(/spatialDataColumn=quadbin/);
    expect(initURL).toMatch(/spatialDataType=quadbin/);
    expect(initURL).toMatch(/q=SELECT\+\*\+FROM\+a\.b\.quadbin_table/);

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('widgetSource', async () => {
    stubGlobalFetchForSource();

    const {widgetSource} = await quadbinQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT *',
      aggregationExp: 'COUNT (*)',
    });

    expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
  });

  test('widgetSource + dynamic point aggregation', async () => {
    stubGlobalFetchForSource(MOCK_INIT_RESPONSE, {
      ...MOCK_TILESET_RESPONSE,
      schema: [{name: 'geom', type: 'geometry'}],
    });

    const {widgetSource} = await quadbinQuerySource({
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT *',
      aggregationExp: 'COUNT (*)',
      spatialDataColumn: 'geom',
    });

    expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
    expect(widgetSource.props.spatialDataType).toBe('geo'); // not 'quadbin'
  });
});
