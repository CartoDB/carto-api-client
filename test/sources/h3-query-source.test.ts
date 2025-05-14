import {WidgetQuerySource, h3QuerySource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {
  MOCK_INIT_RESPONSE,
  MOCK_TILESET_RESPONSE,
  stubGlobalFetchForSource,
} from '../__mock-fetch.js';

describe('h3QuerySource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await h3QuerySource({
      connectionName: 'carto_dw',
      clientId: 'CUSTOM_CLIENT',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.h3_table',
      aggregationExp: 'SUM(population) as pop',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/query/);
    expect(initURL).toMatch(/aggregationExp=SUM%28population%29\+as\+pop/);
    expect(initURL).toMatch(/spatialDataColumn=h3/);
    expect(initURL).toMatch(/spatialDataType=h3/);
    expect(initURL).toMatch(/q=SELECT\+\*\+FROM\+a\.b\.h3_table/);
    expect(initURL).toMatch(/client=CUSTOM_CLIENT/);

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
  });

  test('widgetSource', async () => {
    stubGlobalFetchForSource();

    const {widgetSource} = await h3QuerySource({
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

    const {widgetSource} = await h3QuerySource({
      localCache: {cacheControl: ['no-cache']}, // prevent caching schema
      accessToken: '<token>',
      connectionName: 'carto_dw',
      sqlQuery: 'SELECT *',
      aggregationExp: 'COUNT (*)',
      spatialDataColumn: 'geom',
    });

    expect(widgetSource).toBeInstanceOf(WidgetQuerySource);
    expect(widgetSource.props.spatialDataType).toBe('geo'); // not 'h3'
  });
});
