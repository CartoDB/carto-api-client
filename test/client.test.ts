import {expect, test} from 'vitest';
import {getClient, setClient, CLIENT_ID} from '@carto/api-client';

test('client', () => {
  expect(getClient()).toBe(CLIENT_ID);
  setClient('custom');
  expect(getClient()).toBe('custom');
  setClient(CLIENT_ID);
  expect(getClient()).toBe(CLIENT_ID);
});
