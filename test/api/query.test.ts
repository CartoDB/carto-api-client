import {test, vi, expect, beforeEach, afterEach} from 'vitest';
import {query} from '@carto/api-client';

const QUERY_RESPONSE = [{id: 1, value: 'string'}];

beforeEach(() => {
  const mockFetch = vi
    .fn()
    .mockReturnValue(
      Promise.resolve({ok: true, json: () => Promise.resolve(QUERY_RESPONSE)})
    );

  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => void vi.restoreAllMocks());

test('query', async (t) => {
  const mockFetch = vi.mocked(fetch);

  const response = await query({
    connectionName: 'carto_dw',
    clientId: 'CUSTOM_CLIENT',
    accessToken: '<token>',
    sqlQuery: 'SELECT * FROM a.b.h3_table',
  });

  expect(mockFetch).toHaveBeenCalledTimes(1);

  const [queryCall] = mockFetch.mock.calls;

  expect(queryCall[0]).toMatch(/v3\/sql\/carto_dw\/query/);
  expect(queryCall[0]).toMatch(/q=SELECT\+\*\+FROM\+a\.b\.h3_table/);
  expect(queryCall[0]).toMatch(/client\=CUSTOM_CLIENT/);

  expect(response).toEqual(QUERY_RESPONSE);
});
