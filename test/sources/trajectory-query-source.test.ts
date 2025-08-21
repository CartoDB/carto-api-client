import {WidgetQuerySource, trajectoryQuerySource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

describe('trajectoryQuerySource', () => {
  test('default', async () => {
    // Mock 3 calls: init, tileset, and getRange
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: {url: [`https://xyz.com?format=tilejson`]},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: '2.2.0',
          tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
          tilestats: {layers: []},
          schema: [],
        }),
      })
      .mockResolvedValueOnce(createMockResponse({rows: [{min: 0, max: 100}]}));
    vi.stubGlobal('fetch', mockFetch);

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

    expect(mockFetch).toHaveBeenCalledTimes(3);

    const [[initURL], [tilesetURL]] = mockFetch.mock.calls;

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
    // Mock 3 calls: init, tileset, and getRange
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: {url: [`https://xyz.com?format=tilejson`]},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: '2.2.0',
          tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
          tilestats: {layers: []},
          schema: [],
        }),
      })
      .mockResolvedValueOnce(createMockResponse({rows: [{min: 0, max: 100}]}));
    vi.stubGlobal('fetch', mockFetch);

    await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = mockFetch.mock.calls;
    expect(initURL).not.toContain('aggregationExp');
    expect(initURL).toMatch(/trajectoryIdColumn=trajectory_id/);
    expect(initURL).toMatch(/timestampColumn=timestamp/);
  });

  test('when columns are not provided', async () => {
    // Mock 3 calls: init, tileset, and getRange
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: {url: [`https://xyz.com?format=tilejson`]},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: '2.2.0',
          tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
          tilestats: {layers: []},
          schema: [],
        }),
      })
      .mockResolvedValueOnce(createMockResponse({rows: [{min: 0, max: 100}]}));
    vi.stubGlobal('fetch', mockFetch);

    await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = mockFetch.mock.calls;
    expect(initURL).not.toContain('columns');
  });

  test('when queryParameters are not provided', async () => {
    // Mock 3 calls: init, tileset, and getRange
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: {url: [`https://xyz.com?format=tilejson`]},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: '2.2.0',
          tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
          tilestats: {layers: []},
          schema: [],
        }),
      })
      .mockResolvedValueOnce(createMockResponse({rows: [{min: 0, max: 100}]}));
    vi.stubGlobal('fetch', mockFetch);

    await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = mockFetch.mock.calls;
    expect(initURL).not.toContain('queryParameters');
  });

  test('timeRange', async () => {
    const expectedTimeRange = {min: 1609459200000, max: 1640995200000}; // Unix timestamps
    
    // Mock both the source initialization and the getRange call for timeRange
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: {url: [`https://xyz.com?format=tilejson`]},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tilejson: '2.2.0',
          tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
          tilestats: {layers: []},
          schema: [],
        }),
      })
      .mockResolvedValueOnce(createMockResponse({rows: [expectedTimeRange]}));
    vi.stubGlobal('fetch', mockFetch);

    const source = await trajectoryQuerySource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      sqlQuery: 'SELECT * FROM a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(source.timeRange).toEqual(expectedTimeRange);

    // Verify the getRange API was called with the timestamp column
    const rangeCallUrl = mockFetch.mock.calls[2][0];
    const params = new URL(rangeCallUrl).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      params: JSON.stringify({
        column: 'timestamp',
      }),
    });
  });
});
