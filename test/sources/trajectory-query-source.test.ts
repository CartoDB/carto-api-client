import {WidgetQuerySource, trajectoryQuerySource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';
import {stubGlobalFetchForSource} from '../__mock-fetch.js';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

describe('trajectoryQuerySource', () => {
  test('default', async () => {
    stubGlobalFetchForSource();

    const tilejson = await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      columns: ['a', 'b'],
      spatialDataColumn: 'geom',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
      queryParameters: {minDuration: 3600},
      aggregationExp: 'COUNT(*)',
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const [[initURL], [tilesetURL]] = vi.mocked(fetch).mock.calls;

    expect(initURL).toMatch(/v3\/maps\/carto_dw\/query/);
    expect(initURL).toMatch(/q=SELECT\+\*\+FROM\+a\.b\.trajectory_table/);
    expect(initURL).toMatch(/columns=a%2Cb/);
    expect(initURL).toMatch(/spatialDataColumn=geom/);
    expect(initURL).toMatch(/spatialDataType=trajectory/);
    expect(initURL).toMatch(/trajectoryIdColumn=trajectory_id/);
    expect(initURL).toMatch(/timestampColumn=timestamp/);
    expect(initURL).toMatch(/aggregationExp=COUNT%28\*%29/);
    expect(initURL).toMatch(/queryParameters=%7B%22minDuration%22%3A3600%7D/);

    expect(tilesetURL).toMatch(/^https:\/\/xyz\.com\/\?format=tilejson/);

    expect(tilejson).toBeTruthy();
    expect(tilejson.tiles).toEqual([
      'https://xyz.com/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(tilejson.accessToken).toBe('<token>');
    expect(tilejson.widgetSource).toBeInstanceOf(WidgetQuerySource);
  });

  test('when aggregationExp is not provided', async () => {
    stubGlobalFetchForSource();

    await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
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

    await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = vi.mocked(fetch).mock.calls;
    expect(initURL).not.toContain('columns');
  });

  test('when queryParameters are not provided', async () => {
    stubGlobalFetchForSource();

    await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = vi.mocked(fetch).mock.calls;
    expect(initURL).not.toContain('queryParameters');
  });

  test('getTimeRange', async () => {
    stubGlobalFetchForSource();

    const source = await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    // Reset fetch mock to prepare for getTimeRange call
    vi.clearAllMocks();
    const expectedTimeRange = {min: 1609459200000, max: 1640995200000}; // Unix timestamps

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({rows: [expectedTimeRange]}));
    vi.stubGlobal('fetch', mockFetch);

    const actualTimeRange = await source.getTimeRange();

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(actualTimeRange).toEqual(expectedTimeRange);

    // Verify it calls the range API with the timestamp column
    const params = new URL(mockFetch.mock.lastCall[0]).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      params: JSON.stringify({
        column: 'timestamp',
      }),
    });
  });
});
