import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {setClient, vectorTableSource} from '@carto/api-client';

const CACHE = 'base-source-test';

const INIT_RESPONSE = {
  tilejson: {url: [`https://xyz.com?format=tilejson&cache=${CACHE}`]},
};

describe('baseSource', () => {
  beforeEach(() => {
    const mockFetch = vi
      .fn()
      .mockReturnValue(
        Promise.resolve({ok: true, json: () => Promise.resolve(INIT_RESPONSE)})
      );

    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => void vi.restoreAllMocks());

  test('clientId', async () => {
    const clientIds = ['deck-gl-carto', 'new-default', 'override-default'];
    const options = {
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'test',
    };

    // Using vectorTableSource as stand-in for baseSource, which is not exported.
    await vectorTableSource({...options});
    setClient(clientIds[1]);
    await vectorTableSource({...options});
    await vectorTableSource({...options, clientId: clientIds[2]});

    const calls = vi.mocked(fetch).mock.calls;

    expect(calls[0][0]).toMatch(`client=${clientIds[0]}`);
    expect(calls[1][0]).toMatch(`client=${clientIds[0]}`);
    expect(calls[2][0]).toMatch(`client=${clientIds[1]}`);
    expect(calls[3][0]).toMatch(`client=${clientIds[1]}`);
    expect(calls[4][0]).toMatch(`client=${clientIds[2]}`);
    expect(calls[5][0]).toMatch(`client=${clientIds[2]}`);
  });
});
