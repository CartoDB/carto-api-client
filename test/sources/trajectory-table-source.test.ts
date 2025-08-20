import {WidgetTableSource, trajectoryTableSource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {stubGlobalFetchForSource} from '../__mock-fetch.js';

describe('trajectoryTableSource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await trajectoryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.trajectory_table',
      columns: ['a', 'b'],
      spatialDataColumn: 'geom',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
      aggregationExp: 'COUNT(*)',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/table/);
    expect(initURL).toMatch(/name=a\.b\.trajectory_table/);
    expect(initURL).toMatch(/columns=a%2Cb/);
    expect(initURL).toMatch(/spatialDataColumn=geom/);
    expect(initURL).toMatch(/spatialDataType=trajectory/);
    expect(initURL).toMatch(/trajectoryIdColumn=trajectory_id/);
    expect(initURL).toMatch(/timestampColumn=timestamp/);
    expect(initURL).toMatch(/aggregationExp=COUNT%28\*%29/);
    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
    expect(tilejson.widgetSource).toBeInstanceOf(WidgetTableSource);
  });

  test('when aggregationExp is not provided', async () => {
    stubGlobalFetchForSource();

    await trajectoryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = vi.mocked(fetch).mock.calls;
    expect(initURL).not.toContain('aggregationExp');
    expect(initURL).toMatch(/trajectoryIdColumn=trajectory_id/);
    expect(initURL).toMatch(/timestampColumn=timestamp/);
  });

  test('when columns are not provided', async () => {
    stubGlobalFetchForSource();

    await trajectoryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = vi.mocked(fetch).mock.calls;
    expect(initURL).not.toContain('columns');
  });
});
