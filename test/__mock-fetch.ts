// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {vi} from 'vitest';

export const MOCK_INIT_RESPONSE = {
  tilejson: {url: [`https://xyz.com?format=tilejson`]},
};

export const MOCK_TILESET_RESPONSE = {
  tilejson: '2.2.0',
  tiles: ['https://xyz.com/{z}/{x}/{y}?formatTiles=binary'],
  tilestats: {layers: []},
  schema: [],
};

/**
 * Stubs global 'fetch' with a mock intended for the two (2) requests
 * required to create a layer source. Initialization or tilejson response
 * may optionally be customized. Additional requests will fail.
 */
export function stubGlobalFetchForSource(
  initResponse = MOCK_INIT_RESPONSE,
  tilesetResponse = MOCK_TILESET_RESPONSE
) {
  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initResponse),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tilesetResponse),
    });
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

const fetch = globalThis.fetch;

type MockFetchCall = {
  url: string;
  headers: Record<string, unknown>;
  method?: 'GET' | 'POST';
  body?: string;
};

type MockResponseFactory = (
  url: string,
  headers: HeadersInit,
  cacheKey?: string
) => Promise<unknown>;

function setupMockFetchMapsV3(
  responseFunc: MockResponseFactory,
  cacheKey = btoa(Math.random().toFixed(4))
): MockFetchCall[] {
  const calls: MockFetchCall[] = [];

  const mockFetch = (url: string, {headers, method, body}) => {
    calls.push({url, headers, method, body});
    if (url.indexOf('formatTiles=binary') !== -1) {
      headers = {
        ...headers,
        'Content-Type': 'application/vnd.carto-vector-tile',
      };
    }
    return responseFunc(url, headers, cacheKey);
  };

  globalThis.fetch = mockFetch as unknown as typeof fetch;

  return calls;
}

function teardownMockFetchMaps() {
  globalThis.fetch = fetch;
}

/** @deprecated Legacy fetch mock for basemap.spec.ts. */
export async function withMockFetchMapsV3(
  testFunc: (calls: MockFetchCall[]) => Promise<void>,
  responseFunc: MockResponseFactory
): Promise<void> {
  try {
    await testFunc(setupMockFetchMapsV3(responseFunc));
  } finally {
    teardownMockFetchMaps();
  }
}
