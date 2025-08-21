import {WidgetTableSource, trajectoryTableSource} from '@carto/api-client';
import {describe, vi, test, expect} from 'vitest';

const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => new Promise((resolve) => resolve(data)),
});

describe('trajectoryTableSource', () => {
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

    expect(mockFetch).toHaveBeenCalledTimes(3);

    const [[initURL], [tilesetURL]] = mockFetch.mock.calls;

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

    await trajectoryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.trajectory_table',
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

    await trajectoryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    const [[initURL]] = mockFetch.mock.calls;
    expect(initURL).not.toContain('columns');
  });

  test('timestampRange', async () => {
    const expectedTimestampRange = {min: 1609459200000, max: 1640995200000}; // Unix timestamps
    
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
      .mockResolvedValueOnce(createMockResponse({rows: [expectedTimestampRange]}));
    vi.stubGlobal('fetch', mockFetch);

    const source = await trajectoryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'timestamp',
    });

    expect(source.timestampRange).toEqual(expectedTimestampRange);

    // Verify that 3 fetch calls were made: init, tileset, getRange
    expect(mockFetch).toHaveBeenCalledTimes(3);
    
    // Verify the getRange API was called with the timestamp column
    const rangeCallUrl = mockFetch.mock.calls[2][0];
    const params = new URL(rangeCallUrl).searchParams.entries();
    expect(Object.fromEntries(params)).toMatchObject({
      params: JSON.stringify({
        column: 'timestamp',
      }),
    });
  });

  test('timestampRange with string timestamps', async () => {
    const expectedTimestampRange = {min: '2017-07-08T12:07:53.000Z', max: '2019-03-06T11:56:39.000Z'};
    
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
      .mockResolvedValueOnce(createMockResponse({rows: [expectedTimestampRange]}));
    vi.stubGlobal('fetch', mockFetch);

    const source = await trajectoryTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'a.b.trajectory_table',
      trajectoryIdColumn: 'trajectory_id',
      timestampColumn: 'created_at',
    });

    expect(source.timestampRange).toEqual(expectedTimestampRange);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
