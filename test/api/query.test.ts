import {test, vi, expect, beforeEach, afterEach} from 'vitest';
import {getClient, query, setClient} from '@carto/api-client';

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

test('query', async () => {
  const mockFetch = vi.mocked(fetch);

  const response = await query({
    connectionName: 'carto_dw',
    accessToken: '<token>',
    sqlQuery: 'SELECT * FROM a.b.h3_table',
  });

  expect(mockFetch).toHaveBeenCalledTimes(1);

  const [queryCall] = mockFetch.mock.calls;

  expect(queryCall[0]).toMatch(/v3\/sql\/carto_dw\/query/);
  expect(queryCall[0]).toMatch(/q=SELECT\+\*\+FROM\+a\.b\.h3_table/);

  expect(response).toEqual(QUERY_RESPONSE);
});

test('clientId', async () => {
  const mockFetch = vi.mocked(fetch);

  const clientIds = ['deck-gl-carto', 'new-default', 'override-default'];

  const options = {
    connectionName: 'carto_dw',
    accessToken: '<token>',
    sqlQuery: 'SELECT * FROM a.b.h3_table',
  };

  await query({...options, sqlQuery: 'SELECT 1'});
  setClient(clientIds[1]);
  await query({...options, sqlQuery: 'SELECT 2'});
  await query({...options, sqlQuery: 'SELECT 2', clientId: clientIds[2]});

  const calls = mockFetch.mock.calls;

  expect(mockFetch).toHaveBeenCalledTimes(3);
  expect(calls[0][0]).toMatch(`client=${clientIds[0]}`);
  expect(calls[1][0]).toMatch(`client=${clientIds[1]}`);
  expect(calls[2][0]).toMatch(`client=${clientIds[2]}`);
});
