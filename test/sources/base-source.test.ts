import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {setClient, vectorTableSource} from '@carto/api-client';
import {MOCK_INIT_RESPONSE, stubGlobalFetchForSource} from '../__mock-fetch.js';

describe('baseSource', () => {
  beforeEach(() => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_INIT_RESPONSE),
    });

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

  test('authMode: session — no auth header, same-origin credentials, proxied tile URLs', async () => {
    const mockFetch = stubGlobalFetchForSource();

    const result = await vectorTableSource({
      connectionName: 'carto_dw',
      authMode: 'session',
      apiBaseUrl: '/app/_proxy/my-app',
      tableName: 'test',
    });

    const calls = mockFetch.mock.calls;
    expect(calls.length).toBe(2);
    for (const [url, init] of calls) {
      expect((init as RequestInit).credentials).toBe('same-origin');
      expect(
        ((init as RequestInit).headers as Record<string, string>).Authorization
      ).toBeUndefined();
      expect(String(url)).not.toMatch(/access_token/);
    }
    // Map instantiation goes to the configured (proxy) base.
    expect(String(calls[0][0])).toMatch(/^\/app\/_proxy\/my-app\/v3\/maps\//);
    // The tilejson dataUrl (absolute, returned by the server) is rewritten.
    expect(String(calls[1][0])).toMatch(/^\/app\/_proxy\/my-app/);

    // Tile templates rewritten onto the proxy; no accessToken on the result.
    expect(result.tiles).toEqual([
      '/app/_proxy/my-app/{z}/{x}/{y}?formatTiles=binary',
    ]);
    expect(result.accessToken).toBeUndefined();
  });

  test('authMode: token (default) — Bearer header, no credentials override', async () => {
    await vectorTableSource({
      connectionName: 'carto_dw',
      accessToken: '<token>',
      tableName: 'test',
    });
    const calls = vi.mocked(fetch).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    for (const [, init] of calls) {
      expect((init.headers as Record<string, string>).Authorization).toBe(
        'Bearer <token>'
      );
      expect(init.credentials).toBeUndefined();
    }
  });
});
