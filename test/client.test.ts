import {expect, test} from 'vitest';
import {getClient, setClient} from '@carto/api-client';

// Source: src/client.ts
const CLIENT_ID = 'carto-api-client';

test('client', () => {
  expect(getClient()).toBe(CLIENT_ID);
  setClient('custom');
  expect(getClient()).toBe('custom');
  setClient(CLIENT_ID);
  expect(getClient()).toBe(CLIENT_ID);
});
